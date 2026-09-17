import { parseEnvironment } from "../config/env.js";
import { createDatabase, connectDatabase } from "../config/database.js";

const database = createDatabase(parseEnvironment(process.env));
try {
  await connectDatabase(database);
  console.log("PostgreSQL connection successful");
} catch {
  console.error("PostgreSQL connection failed. Check database availability and DATABASE_URL.");
  process.exitCode = 1;
} finally {
  await database.$disconnect();
}
