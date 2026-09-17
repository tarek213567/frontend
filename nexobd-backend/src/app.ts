import { randomUUID } from "node:crypto";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import type { Logger } from "pino";
import type { Environment } from "./config/env.js";
import { openapi } from "./config/openapi.js";
import { errorHandler } from "./middleware/error-handler.js";
import { createRoutes } from "./routes/index.js";
import { HealthService } from "./services/health.service.js";
import { ApiError } from "./utils/api-error.js";
import type { AuthService } from "./services/auth.service.js";
import { createAuthRoutes } from "./routes/auth.routes.js";
import type { CatalogServices } from "./types/catalog.js";
import { createCategoryRoutes } from "./routes/category.routes.js";
import { createProductRoutes } from "./routes/product.routes.js";

export function createApp(env: Environment, logger: Logger, health = new HealthService(), auth?: AuthService, catalog?: CatalogServices) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY.length ? env.TRUST_PROXY : false);
  app.use((_req, res, next) => {
    const requestId = randomUUID();
    res.locals.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);
    res.setHeader("Cache-Control", "no-store");
    res.on("finish", () => logger.info({ requestId, status: res.statusCode }, "Request completed"));
    next();
  });
  app.use(helmet());
  app.use(cors({
    origin: (value, callback) => {
      if (!value || env.CORS_ORIGINS.includes(value)) return callback(null, true);
      callback(new ApiError(403, "ORIGIN_DENIED", "Origin is not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "Idempotency-Key"],
    exposedHeaders: ["X-Request-Id"],
  }));
  app.use("/api", rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS, limit: env.RATE_LIMIT_MAX,
    standardHeaders: "draft-8", legacyHeaders: false,
    handler: (_req, _res, next) => next(new ApiError(429, "RATE_LIMITED", "Too many requests")),
  }));
  app.use(express.json({ limit: "100kb", strict: true }));
  if (auth) app.use("/api/auth", createAuthRoutes(auth, env));
  if (auth && catalog) {
    app.use("/api/categories", createCategoryRoutes(catalog.categories, auth));
    app.use("/api/products", createProductRoutes(catalog.products, auth));
  }
  app.use("/api", createRoutes(health));
  app.use("/api/v1", createRoutes(health));
  if (env.API_DOCS_ENABLED) {
    app.get("/api/v1/openapi.json", (_req, res) => { res.json(openapi); });
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi, { swaggerOptions: { supportedSubmitMethods: [] } }));
  }
  app.use((_req, _res, next) => next(new ApiError(404, "NOT_FOUND", "Route not found")));
  app.use(errorHandler(logger));
  return app;
}
