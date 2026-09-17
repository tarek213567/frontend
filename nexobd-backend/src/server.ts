import { createApp } from "./app.js";
import { parseEnvironment } from "./config/env.js";
import { createDatabase, connectDatabase } from "./config/database.js";
import { HealthService } from "./services/health.service.js";
import { createLogger } from "./utils/logger.js";
import { AuthService } from "./services/auth.service.js";
import { PrismaAuthRepository } from "./repositories/auth.repository.js";
import { CategoryRepository } from "./repositories/category.repository.js";
import { ProductRepository } from "./repositories/product.repository.js";
import { CategoryService } from "./services/category.service.js";
import { ProductService } from "./services/product.service.js";

const env = parseEnvironment(process.env);
const logger = createLogger(env.LOG_LEVEL);
const database = createDatabase(env);
try {
  // Fail closed before accepting traffic; no tables are created.
  await connectDatabase(database);
} catch {
  logger.fatal("PostgreSQL startup connection failed; check database availability and configuration");
  await database.$disconnect();
  process.exit(1);
}
const health = new HealthService();
const auth = new AuthService(new PrismaAuthRepository(database), env);
const productRepo = new ProductRepository(database);
const catalog = {
  categories: new CategoryService(new CategoryRepository(database)),
  products: new ProductService(productRepo),
};
const server = createApp(env, logger, health, auth, catalog).listen(env.PORT, env.HOST, () => {
  logger.info({ port: env.PORT, host: env.HOST }, "NexoBD API listening");
});
server.requestTimeout = 30000;
server.headersTimeout = 10000;
server.keepAliveTimeout = 5000;
let shuttingDown = false;
function shutdown(exitCode: number) {
  if (shuttingDown) return;
  shuttingDown = true;
  health.beginShutdown();
  const timer = setTimeout(() => { server.closeAllConnections(); process.exit(1); }, 10000);
  timer.unref();
  server.close(() => {
    void database.$disconnect().then(() => {
      clearTimeout(timer);
      process.exit(exitCode);
    }).catch(() => { logger.error("Database disconnect failed"); process.exit(1); });
  });
}
process.on("SIGTERM", () => shutdown(0));
process.on("SIGINT", () => shutdown(0));
server.on("error", () => { logger.fatal("HTTP server failed"); shutdown(1); });
process.on("unhandledRejection", () => { logger.fatal("Unhandled rejection"); shutdown(1); });
process.on("uncaughtException", () => { logger.fatal("Uncaught exception"); shutdown(1); });
