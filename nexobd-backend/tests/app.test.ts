import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";
import { parseEnvironment } from "../src/config/env.js";
import { createLogger } from "../src/utils/logger.js";
import { HealthService } from "../src/services/health.service.js";

const env = parseEnvironment({ NODE_ENV: "test", LOG_LEVEL: "silent", API_DOCS_ENABLED: "true", DATABASE_URL: "postgresql://test:test@localhost:5432/test", JWT_ACCESS_SECRET: "a".repeat(64) });
const makeApp = () => createApp(env, createLogger("silent"));
test("requested health endpoint has the exact response", async () => {
  const response = await request(makeApp()).get("/api/health").expect(200);
  assert.deepEqual(response.body, { status: "success", message: "NexoBD Backend Running" });
});
test("health is live, security headers present, and identifiers generated", async () => {
  const response = await request(makeApp()).get("/api/v1/health/live").expect(200);
  assert.equal(response.body.data.status, "ok");
  assert.ok(response.headers["x-request-id"]);
  assert.equal(response.headers["x-content-type-options"], "nosniff");
  assert.equal(response.headers["x-powered-by"], undefined);
});
test("readiness fails while draining", async () => {
  const health = new HealthService();
  health.beginShutdown();
  await request(createApp(env, createLogger("silent"), health)).get("/api/v1/health/ready").expect(503);
});
test("CORS permits configured frontend and rejects another origin", async () => {
  await request(makeApp()).get("/api/v1/health/live").set("Origin", "https://evil.example").expect(403);
  const response = await request(makeApp()).options("/api/v1/health/live")
    .set("Origin", "http://localhost:3000").set("Access-Control-Request-Method", "GET").expect(204);
  assert.equal(response.headers["access-control-allow-origin"], "http://localhost:3000");
});
test("malformed and oversized JSON return safe errors", async () => {
  const malformed = await request(makeApp()).post("/api/v1/unknown").set("Content-Type", "application/json").send('{"bad":').expect(400);
  assert.equal(malformed.body.error.code, "INVALID_JSON");
  await request(makeApp()).post("/api/v1/unknown").send({ value: "x".repeat(110000) }).expect(413);
});
test("unknown routes and rate limits use the error envelope", async () => {
  const app = createApp({ ...env, RATE_LIMIT_MAX: 1 }, createLogger("silent"));
  const missing = await request(app).get("/api/v1/missing").expect(404);
  assert.equal(missing.body.error.code, "NOT_FOUND");
  const limited = await request(app).get("/api/v1/health/live").expect(429);
  assert.equal(limited.body.error.code, "RATE_LIMITED");
});
test("documentation is configurable", async () => {
  await request(makeApp()).get("/api/v1/openapi.json").expect(200);
  await request(createApp({ ...env, API_DOCS_ENABLED: false }, createLogger("silent"))).get("/docs").expect(404);
});
test("production rejects insecure origins without echoing values", () => {
  assert.throws(() => parseEnvironment({ NODE_ENV: "production", DATABASE_URL: env.DATABASE_URL, JWT_ACCESS_SECRET: env.JWT_ACCESS_SECRET, CORS_ORIGINS: "http://secret.example" }), /^Error: Invalid environment fields: CORS_ORIGINS$/);
});
test("invalid database URL and missing signing secret fail safely", () => {
  assert.throws(() => parseEnvironment({ DATABASE_URL: "not-a-url" }), /Invalid environment fields/);
});
