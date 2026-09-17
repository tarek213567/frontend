import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import bcrypt from "bcrypt";

// Execute the actual migration in an isolated embedded PostgreSQL engine.
// This checks SQL behavior; it does not claim to verify the hosted database.
test("initial migration enforces ecommerce invariants and preserves order history", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(await readFile(new URL("../prisma/migrations/20260917000100_init/migration.sql", import.meta.url), "utf8"));
  const user = randomUUID(), category = randomUUID(), product = randomUUID(), order = randomUUID();
  const hash = await bcrypt.hash("test-password-only", 4);
  await db.query('INSERT INTO users (id,name,email,password_hash,"updatedAt") VALUES ($1,$2,$3,$4,now())', [user, "Customer", "customer@example.com", hash]);
  await db.query('INSERT INTO categories (id,name,slug,"updatedAt") VALUES ($1,$2,$3,now())', [category, "Electronics", "electronics"]);
  await db.query('INSERT INTO products (id,name,slug,description,price,stock,"categoryId","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,now())', [product, "Phone", "phone", "Test phone", "100.10", 5, category]);

  const fails = async (sql: string, values: unknown[], code: string | string[]) => {
    const accepted = typeof code === "string" ? [code] : code;
    await assert.rejects(db.query(sql, values), (error: unknown) => accepted.includes((error as { code: string }).code));
  };
  await t.test("canonical unique emails and bcrypt-only passwords", async () => {
    const sql = 'INSERT INTO users (id,name,email,password_hash,"updatedAt") VALUES ($1,$2,$3,$4,now())';
    await fails(sql, [randomUUID(), "Duplicate", "customer@example.com", hash], "23505");
    await fails(sql, [randomUUID(), "Mixed", "Customer@example.com", hash], "23514");
    await fails(sql, [randomUUID(), "Plain", "plain@example.com", "plaintext"], "23514");
  });
  await t.test("valid monetary amounts, stock and discounts", async () => {
    for (const value of ["-1", "NaN"]) await fails('UPDATE products SET price=$1 WHERE id=$2', [value, product], "23514");
    await fails('UPDATE products SET stock=-1 WHERE id=$1', [product], "23514");
    await fails('UPDATE products SET "discountPrice"=101 WHERE id=$1', [product], "23514");
    await db.query('UPDATE products SET "discountPrice"=90.05 WHERE id=$1', [product]);
    const result = await db.query<{ value: string }>('SELECT (price*3)::text AS value FROM products WHERE id=$1', [product]);
    assert.equal(result.rows[0]?.value, "300.30");
  });
  await t.test("cart ownership, unique lines, positive quantities and foreign keys", async () => {
    const sql = 'INSERT INTO cart_items (id,"userId","productId",quantity) VALUES ($1,$2,$3,$4)';
    await fails(sql, [randomUUID(), user, product, 0], "23514");
    await fails(sql, [randomUUID(), randomUUID(), product, 1], "23503");
    await db.query(sql, [randomUUID(), user, product, 2]);
    await fails(sql, [randomUUID(), user, product, 1], "23505");
  });
  await t.test("review range and one review per user/product", async () => {
    const sql = 'INSERT INTO reviews (id,"userId","productId",rating) VALUES ($1,$2,$3,$4)';
    for (const rating of [0, 6]) await fails(sql, [randomUUID(), user, product, rating], "23514");
    await db.query(sql, [randomUUID(), user, product, 5]);
    await fails(sql, [randomUUID(), user, product, 4], "23505");
  });
  await t.test("order snapshots and restrictive deletion", async () => {
    const sql = 'INSERT INTO orders (id,"userId","totalAmount","paymentMethod","shippingAddress","updatedAt") VALUES ($1,$2,$3,$4,$5,now())';
    await fails(sql, [randomUUID(), user, "-1", "COD", '{"city":"Dhaka"}'], "23514");
    await fails(sql, [randomUUID(), user, "100.10", "COD", '[]'], "23514");
    await db.query(sql, [order, user, "100.10", "COD", '{"city":"Dhaka"}']);
    const lineSql = 'INSERT INTO order_items (id,"orderId","productId",quantity,price,"productName") VALUES ($1,$2,$3,$4,$5,$6)';
    await fails(lineSql, [randomUUID(), order, product, 0, "100.10", "Phone"], "23514");
    await db.query(lineSql, [randomUUID(), order, product, 1, "100.10", "Phone"]);
    await fails(lineSql, [randomUUID(), order, product, 1, "100.10", "Phone"], "23505");
    for (const [table, id] of [["users", user], ["products", product], ["orders", order], ["categories", category]]) {
      // PostgreSQL engine versions distinguish restrict_violation from generic foreign_key_violation.
      await fails(`DELETE FROM ${table} WHERE id=$1`, [id], ["23503", "23001"]);
    }
    await db.query('UPDATE products SET name=$1, price=120 WHERE id=$2', ["Renamed phone", product]);
    const result = await db.query<{ productName: string; price: string }>('SELECT "productName",price::text FROM order_items WHERE "orderId"=$1', [order]);
    assert.deepEqual(result.rows[0], { productName: "Phone", price: "100.10" });
  });
  await t.test("unreferenced user deletion cascades only cart/reviews", async () => {
    const temporary = randomUUID();
    await db.query('INSERT INTO users (id,name,email,password_hash,"updatedAt") VALUES ($1,$2,$3,$4,now())', [temporary, "Temporary", "temporary@example.com", hash]);
    await db.query('INSERT INTO cart_items (id,"userId","productId") VALUES ($1,$2,$3)', [randomUUID(), temporary, product]);
    await db.query('INSERT INTO reviews (id,"userId","productId",rating) VALUES ($1,$2,$3,4)', [randomUUID(), temporary, product]);
    await db.query('DELETE FROM users WHERE id=$1', [temporary]);
    for (const table of ["cart_items", "reviews"]) {
      const result = await db.query(`SELECT id FROM ${table} WHERE "userId"=$1`, [temporary]);
      assert.equal(result.rows.length, 0);
    }
  });
});
