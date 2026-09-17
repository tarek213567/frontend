import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import request from "supertest";
import jwt from "jsonwebtoken";
import { parseEnvironment } from "../src/config/env.js";
import { createDatabase } from "../src/config/database.js";
import { PrismaAuthRepository } from "../src/repositories/auth.repository.js";
import { AuthService } from "../src/services/auth.service.js";
import { createApp } from "../src/app.js";
import { createLogger } from "../src/utils/logger.js";
import { authorizeRoles, protectRoute } from "../src/middleware/auth.middleware.js";
import { verifyPassword } from "../src/utils/password.js";
import { hashRefreshToken } from "../src/utils/jwt.js";

test("authentication HTTP flow uses the actual Prisma repository and migrations", { timeout: 90000 }, async (t) => {
  const embedded = await PGlite.create({ extensions: { pg_trgm } });
  const migrations = new URL("../prisma/migrations/", import.meta.url);
  for (const folder of (await readdir(migrations)).filter((name) => /^\d/.test(name)).sort()) {
    await embedded.exec(await readFile(new URL(`${folder}/migration.sql`, migrations), "utf8"));
  }
  const socket = new PGLiteSocketServer({ db: embedded, port: 0, host: "127.0.0.1", maxConnections: 1 });
  await socket.start();
  t.after(async () => { await socket.stop(); await embedded.close(); });
  const env = parseEnvironment({ NODE_ENV: "test", LOG_LEVEL: "silent", DATABASE_URL: `postgresql://postgres:postgres@${socket.getServerConn()}/postgres`,
    JWT_ACCESS_SECRET: "b".repeat(64), BCRYPT_ROUNDS: "10", DB_POOL_MAX: "1", RATE_LIMIT_MAX: "1000" });
  const db = createDatabase(env);
  t.after(() => db.$disconnect());
  const repo = new PrismaAuthRepository(db);
  const service = new AuthService(repo, env);
  const app = createApp(env, createLogger("silent"), undefined, service);
  const input = { name: "Customer", email: " CUSTOMER@example.com ", phone: "+8801712345678", password: "a-long-test-password" };
  let registered: { user: { id: string; role: string }; accessToken: string; refreshToken: string };

  await t.test("register validates, normalizes, hashes and forbids role injection", async () => {
    await request(app).post("/api/auth/register").send({ ...input, role: "ADMIN" }).expect(400);
    await request(app).post("/api/auth/register").send({ ...input, password: "short" }).expect(400);
    await request(app).post("/api/auth/register").send({ ...input, password: "🙂".repeat(20) }).expect(400);
    const response = await request(app).post("/api/auth/register").send(input).expect(201);
    registered = response.body;
    assert.equal(registered.user.role, "CUSTOMER");
    assert.equal(response.body.user.email, "customer@example.com");
    assert.equal(response.body.user.password, undefined);
    assert.equal(response.body.user.password_hash, undefined);
    const user = await db.user.findUniqueOrThrow({ where: { id: registered.user.id } });
    assert.notEqual(user.password, input.password);
    assert.equal(await verifyPassword(input.password, user.password), true);
    const stored = await db.refreshToken.findUniqueOrThrow({ where: { tokenHash: hashRefreshToken(registered.refreshToken) } });
    assert.equal(stored.tokenHash.length, 64);
    assert.notEqual(stored.tokenHash, registered.refreshToken);
    await request(app).post("/api/auth/register").send(input).expect(409);
  });
  await t.test("login failures are generic and successful login has safe user", async () => {
    const wrong = await request(app).post("/api/auth/login").send({ email: input.email, password: "wrong-password" }).expect(401);
    const missing = await request(app).post("/api/auth/login").send({ email: "missing@example.com", password: "wrong-password" }).expect(401);
    assert.equal(wrong.body.error.message, missing.body.error.message);
    const response = await request(app).post("/api/auth/login").send({ email: input.email, password: input.password }).expect(200);
    assert.ok(response.body.accessToken);
    assert.equal(response.body.user.password, undefined);
  });
  await t.test("protected routes reject missing, tampered, expired and wrong-audience JWTs", async () => {
    await request(app).get("/api/auth/me").expect(401);
    await request(app).get("/api/auth/me").set("Authorization", "Bearer bad-token").expect(401);
    await request(app).get("/api/auth/me").set("Authorization", `Bearer ${registered.accessToken}`).expect(200);
    const original = jwt.decode(registered.accessToken) as jwt.JwtPayload;
    for (const options of [{ audience: env.JWT_AUDIENCE, expiresIn: -1 }, { audience: "wrong", expiresIn: 60 }]) {
      const token = jwt.sign({ sid: original.sid, type: "access" }, env.JWT_ACCESS_SECRET, {
        algorithm: "HS256", subject: registered.user.id, jwtid: original.jti, issuer: env.JWT_ISSUER, ...options,
      });
      await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`).expect(401);
    }
  });
  await t.test("roles use current database value, and customer cannot access admin", async () => {
    // Isolated example endpoint only; no new production admin API.
    // Mount before a fresh local router's error handlers via a dedicated Express instance.
    const express = (await import("express")).default;
    const example = express();
    example.get("/admin", protectRoute(service), authorizeRoles("ADMIN"), (_req, res) => { res.json({ success: true }); });
    example.use((error: { status?: number }, _req: import("express").Request, res: import("express").Response, _next: import("express").NextFunction) => { res.status(error.status ?? 500).json({ success: false }); });
    await request(example).get("/admin").set("Authorization", `Bearer ${registered.accessToken}`).expect(403);
    await db.user.update({ where: { id: registered.user.id }, data: { role: "ADMIN" } });
    await request(example).get("/admin").set("Authorization", `Bearer ${registered.accessToken}`).expect(200);
    await db.user.update({ where: { id: registered.user.id }, data: { role: "CUSTOMER" } });
  });
  await t.test("rotation changes token; replay revokes the complete family", async () => {
    const response = await request(app).post("/api/auth/refresh").send({ refreshToken: registered.refreshToken }).expect(200);
    assert.notEqual(response.body.refreshToken, registered.refreshToken);
    await request(app).post("/api/auth/refresh").send({ refreshToken: registered.refreshToken }).expect(401);
    await request(app).post("/api/auth/refresh").send({ refreshToken: response.body.refreshToken }).expect(401);
    await request(app).get("/api/auth/me").set("Authorization", `Bearer ${response.body.accessToken}`).expect(401);
  });
  await t.test("parallel refresh permits one rotation then revokes on reuse", async () => {
    const login = await request(app).post("/api/auth/login").send({ email: input.email, password: input.password }).expect(200);
    const results = await Promise.all([1, 2].map(() => request(app).post("/api/auth/refresh").send({ refreshToken: login.body.refreshToken })));
    assert.deepEqual(results.map((response) => response.status).sort(), [200, 401]);
    const successful = results.find((response) => response.status === 200)!;
    await request(app).post("/api/auth/refresh").send({ refreshToken: successful.body.refreshToken }).expect(401);
  });
  await t.test("logout is idempotent and invalidates access and refresh", async () => {
    const login = await request(app).post("/api/auth/login").send({ email: input.email, password: input.password }).expect(200);
    for (let count = 0; count < 2; count++) await request(app).post("/api/auth/logout").send({ refreshToken: login.body.refreshToken }).expect(200);
    await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.accessToken}`).expect(401);
    await request(app).post("/api/auth/refresh").send({ refreshToken: login.body.refreshToken }).expect(401);
  });
  await t.test("expired sessions are rejected", async () => {
    const login = await service.login({ email: "customer@example.com", password: input.password });
    const claims = jwt.decode(login.accessToken) as jwt.JwtPayload;
    // Keep the schema's expiry > createdAt invariant while making the session expired.
    await db.authSession.update({ where: { id: claims.sid }, data: { createdAt: new Date(Date.now() - 60000), expiresAt: new Date(Date.now() - 1000) } });
    await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.accessToken}`).expect(401);
    await request(app).post("/api/auth/refresh").send({ refreshToken: login.refreshToken }).expect(401);
  });
  await t.test("cookie mode requires trusted Origin/header and uses HttpOnly cookies", async () => {
    const cookieEnv = { ...env, AUTH_COOKIE_ENABLED: true };
    const cookieApp = createApp(cookieEnv, createLogger("silent"), undefined, new AuthService(repo, cookieEnv));
    await request(cookieApp).post("/api/auth/login").send({ email: input.email, password: input.password }).expect(403);
    await request(cookieApp).post("/api/auth/login").set("Origin", "http://localhost:3000").send({ email: input.email, password: input.password }).expect(403);
    const agent = request.agent(cookieApp);
    const login = await agent.post("/api/auth/login").set("Origin", "http://localhost:3000").set("X-CSRF-Token", "nexobd").send({ email: input.email, password: input.password }).expect(200);
    const cookie = login.headers["set-cookie"]?.[0];
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
    assert.equal(login.body.refreshToken, undefined);
    await agent.post("/api/auth/refresh").set("Origin", "http://localhost:3000").set("X-CSRF-Token", "nexobd").send({}).expect(200);
    const logout = await agent.post("/api/auth/logout").set("Origin", "http://localhost:3000").set("X-CSRF-Token", "nexobd").send({}).expect(200);
    assert.match(logout.headers["set-cookie"]?.[0], /Expires=Thu, 01 Jan 1970/);
  });
  await t.test("production cookie is Secure and cross-site mode is explicit", async () => {
    const production = { ...env, NODE_ENV: "production" as const, AUTH_COOKIE_ENABLED: true,
      AUTH_COOKIE_SAME_SITE: "none" as const, CORS_ORIGINS: ["https://nexobd.pro"] };
    const productionApp = createApp(production, createLogger("silent"), undefined, new AuthService(repo, production));
    const login = await request(productionApp).post("/api/auth/login").set("Origin", "https://nexobd.pro")
      .set("X-CSRF-Token", "nexobd").send({ email: input.email, password: input.password }).expect(200);
    assert.match(login.headers["set-cookie"]?.[0], /; Secure/);
    assert.match(login.headers["set-cookie"]?.[0], /SameSite=None/);
    assert.equal(login.body.refreshToken, undefined);
  });
  await t.test("auth rate limiter bounds unauthorized requests", async () => {
    const limited = createApp(env, createLogger("silent"), undefined, service);
    for (let index = 0; index < 30; index++) await request(limited).get("/api/auth/me").expect(401);
    const response = await request(limited).get("/api/auth/me").expect(429);
    assert.equal(response.body.error.code, "AUTH_RATE_LIMITED");
  });
  await t.test("concurrent registrations cannot duplicate an email", async () => {
    const concurrent = { name: "Race", email: "race@example.com", password: input.password };
    const results = await Promise.allSettled([service.register(concurrent), service.register(concurrent)]);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    const rejected = results.find((result) => result.status === "rejected") as PromiseRejectedResult;
    assert.equal(rejected.reason.status, 409);
    assert.equal(await db.user.count({ where: { email: concurrent.email } }), 1);
  });
});
