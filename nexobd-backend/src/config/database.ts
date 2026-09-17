import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/client.js";
import type { Environment } from "./env.js";

export function createDatabase(env: Environment) {
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
    max: env.DB_POOL_MAX,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    statement_timeout: 5000,
  });
  return new PrismaClient({ adapter });
}

export async function connectDatabase(database: ReturnType<typeof createDatabase>) {
  await database.$connect();
  await database.$queryRaw`SELECT 1`;
}
