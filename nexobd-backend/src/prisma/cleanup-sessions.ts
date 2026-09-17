import { parseEnvironment } from "../config/env.js";
import { createDatabase } from "../config/database.js";

const database = createDatabase(parseEnvironment(process.env));
try {
  // Retain hashes until family expiry so replay remains detectable throughout its life.
  const result = await database.authSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  console.log(`Removed ${result.count} expired authentication sessions`);
} catch {
  console.error("Authentication session cleanup failed");
  process.exitCode = 1;
} finally { await database.$disconnect(); }
