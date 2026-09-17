import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import request from "supertest";
import sharp from "sharp";
import bcrypt from "bcrypt";
import { parseEnvironment } from "../src/config/env.js";
import { createDatabase } from "../src/config/database.js";
import { PrismaAuthRepository } from "../src/repositories/auth.repository.js";
import { ProductRepository } from "../src/repositories/product.repository.js";
import { CategoryRepository } from "../src/repositories/category.repository.js";
import { AuthService } from "../src/services/auth.service.js";
import { ProductService } from "../src/services/product.service.js";
import { CategoryService } from "../src/services/category.service.js";
import { createApp } from "../src/app.js";
import { createLogger } from "../src/utils/logger.js";

test("product and category HTTP APIs use existing authentication and actual Prisma repositories", { timeout: 90000 }, async (t) => {
  const embedded = await PGlite.create({ extensions: { pg_trgm } });
  const migrations = new URL("../prisma/migrations/", import.meta.url);
  for (const folder of (await readdir(migrations)).filter((name) => /^\d/.test(name)).sort()) {
    await embedded.exec(await readFile(new URL(`${folder}/migration.sql`, migrations), "utf8"));
  }
  const socket = new PGLiteSocketServer({ db: embedded, port: 0, host: "127.0.0.1", maxConnections: 1 });
  await socket.start();
  t.after(async () => { await socket.stop(); await embedded.close(); });
  const env = parseEnvironment({ NODE_ENV: "test", LOG_LEVEL: "silent", DATABASE_URL: `postgresql://postgres:postgres@${socket.getServerConn()}/postgres`,
    JWT_ACCESS_SECRET: "c".repeat(64), BCRYPT_ROUNDS: "10", DB_POOL_MAX: "1", RATE_LIMIT_MAX: "1000" });
  const db = createDatabase(env);
  t.after(() => db.$disconnect());
  const auth = new AuthService(new PrismaAuthRepository(db), env);
  const hash = await bcrypt.hash("a-long-test-password", 10);
  const accounts = await Promise.all((["ADMIN", "SELLER", "SELLER", "CUSTOMER"] as const).map((role, index) => db.user.create({ data: {
    name: `Actor ${index}`, email: `actor${index}@example.com`, password: hash, role,
  } })));
  const tokens = await Promise.all(accounts.map((account) => auth.login({ email: account.email, password: "a-long-test-password" })));
  const bearer = (index: number) => `Bearer ${tokens[index]!.accessToken}`;

  const products = new ProductService(new ProductRepository(db));
  const categories = new CategoryService(new CategoryRepository(db));
  const app = createApp(env, createLogger("silent"), undefined, auth, { products, categories });
  let categoryId = "", productId = "";
  const input = () => ({ name: "Phone", description: "Premium phone", price: "1000.25", discountPrice: "900.10", stock: 3, categoryId });

  await t.test("category creation requires ADMIN and rejects duplicates", async () => {
    await request(app).post("/api/categories").send({ name: "Electronics" }).expect(401);
    for (const index of [1, 2, 3]) {
      await request(app).post("/api/categories").set("Authorization", bearer(index)).send({ name: "Electronics" }).expect(403);
    }
    await request(app).post("/api/categories").set("Authorization", bearer(0)).send({ name: "" }).expect(400);
    const created = await request(app).post("/api/categories").set("Authorization", bearer(0)).send({ name: "Electronics", slug: "electronics" }).expect(201);
    categoryId = created.body.data.id;
    await request(app).post("/api/categories").set("Authorization", bearer(0)).send({ name: "Duplicate", slug: "electronics" }).expect(409);
    const list = await request(app).get("/api/categories").expect(200);
    assert.equal(list.body.pagination.total, 1);
    assert.equal(list.body.data[0].id, categoryId);
    await request(app).get("/api/categories?limit=1000").expect(400);
  });
  await t.test("product creation validates fields and relational integrity", async () => {
    await request(app).post("/api/products").send(input()).expect(401);
    for (const index of [1, 2, 3]) {
      await request(app).post("/api/products").set("Authorization", bearer(index)).send(input()).expect(403);
    }
    for (const patch of [{ price: -1 }, { price: "1.234" }, { discountPrice: "1001.00" }, { stock: -1 },
      { sellerId: accounts[1]!.id }, { images: ["javascript:alert(1)"] }]) {
      await request(app).post("/api/products").set("Authorization", bearer(0)).send({ ...input(), ...patch }).expect(400);
    }
    const created = await request(app).post("/api/products").set("Authorization", bearer(0)).send({ ...input(), slug: "phone" }).expect(201);
    productId = created.body.data.id;
    assert.equal(created.body.data.price, "1000.25");
    assert.equal(created.body.data.status, "ACTIVE");
    assert.equal(created.body.data.sellerId, undefined);
    await request(app).post("/api/products").set("Authorization", bearer(0)).send({ ...input(), slug: "phone" }).expect(409);
    await request(app).post("/api/products").set("Authorization", bearer(0)).send({ ...input(), slug: "bad-category", categoryId: accounts[0]!.id }).expect(409);
  });
  await t.test("public product reads are paginated and include category", async () => {
    await request(app).post("/api/products").set("Authorization", bearer(0)).send({ ...input(), name: "Headphones", slug: "headphones" }).expect(201);
    const list = await request(app).get("/api/products?page=1&limit=1").expect(200);
    assert.equal(list.body.data.length, 1);
    assert.equal(list.body.pagination.total, 2);
    assert.equal(list.body.pagination.totalPages, 2);
    const detail = await request(app).get('/api/products/' + productId).expect(200);
    assert.equal(detail.body.data.category.id, categoryId);
    assert.equal(detail.body.data.stock, 3);
    await request(app).get("/api/products/bad-id").expect(400);
    await request(app).get('/api/products/' + accounts[0]!.id).expect(404);
    await request(app).get("/api/products?limit=1000").expect(400);
  });
  await t.test("updates require ADMIN, preserve omitted fields and validate merged prices", async () => {
    for (const index of [1, 2, 3]) {
      await request(app).put('/api/products/' + productId).set("Authorization", bearer(index)).send({ name: "Unauthorized" }).expect(403);
      await request(app).delete('/api/products/' + productId).set("Authorization", bearer(index)).expect(403);
    }
    await request(app).put('/api/products/' + productId).send({ name: "Unauthorized" }).expect(401);
    const updated = await request(app).put('/api/products/' + productId).set("Authorization", bearer(0)).send({ name: "Phone Pro" }).expect(200);
    assert.equal(updated.body.data.stock, 3);
    assert.deepEqual(updated.body.data.images, []);
    assert.equal(updated.body.data.status, "ACTIVE");
    await request(app).put('/api/products/' + productId).set("Authorization", bearer(0)).send({ price: "100.00" }).expect(400);
    await request(app).put('/api/products/' + productId).set("Authorization", bearer(0)).send({}).expect(400);
    const stock = await request(app).put('/api/products/' + productId).set("Authorization", bearer(0)).send({ stock: 10, images: ["https://images.example.com/phone.webp"] }).expect(200);
    assert.equal(stock.body.data.stock, 10);
    assert.equal(stock.body.data.images.length, 1);
    await request(app).put('/api/products/' + accounts[0]!.id).set("Authorization", bearer(0)).send({ name: "Missing" }).expect(404);
  });
  await t.test("deletion hides products and preserves database references", async () => {
    await db.review.create({ data: { userId: accounts[3]!.id, productId, rating: 5 } });
    await request(app).delete('/api/products/' + productId).expect(401);
    await request(app).delete('/api/products/' + productId).set("Authorization", bearer(0)).expect(204);
    await request(app).get('/api/products/' + productId).expect(404);
    await request(app).put('/api/products/' + productId).set("Authorization", bearer(0)).send({ name: "Restore" }).expect(404);
    await request(app).delete('/api/products/' + productId).set("Authorization", bearer(0)).expect(404);
    const retained = await db.product.findUniqueOrThrow({ where: { id: productId } });
    assert.equal(retained.status, "ARCHIVED");
    assert.ok(retained.deletedAt);
    assert.equal(await db.review.count({ where: { productId } }), 1);
    assert.equal((await request(app).get("/api/products").expect(200)).body.pagination.total, 1);
  });
});
