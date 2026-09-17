import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import type { Environment } from "../config/env.js";
import type { AuthService } from "../services/auth.service.js";
import { AuthController } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.js";
import { registerSchema, loginSchema, refreshSchema } from "../models/auth.schema.js";
import { ApiError } from "../utils/api-error.js";

export function createAuthRoutes(service: AuthService, env: Environment) {
  const router = Router();
  const controller = new AuthController(service, env);
  router.use(rateLimit({ windowMs: 15 * 60000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false,
    handler: (_req, _res, next) => next(new ApiError(429, "AUTH_RATE_LIMITED", "Too many authentication requests")) }));
  router.use((req, _res, next) => {
    // Cookie mode requires explicit trusted browser origin AND a custom header on mutations.
    // This covers login CSRF too and rejects simple cross-site form submissions.
    if (env.AUTH_COOKIE_ENABLED && req.method === "POST" &&
      (!req.headers.origin || !env.CORS_ORIGINS.includes(req.headers.origin) || req.headers["x-csrf-token"] !== "nexobd")) {
      throw new ApiError(403, "CSRF_REJECTED", "Trusted Origin and X-CSRF-Token header are required");
    }
    next();
  });
  router.post("/register", validateBody(registerSchema), controller.register);
  router.post("/login", validateBody(loginSchema), controller.login);
  router.post("/refresh", validateBody(refreshSchema), controller.refresh);
  router.post("/logout", validateBody(refreshSchema), controller.logout);
  router.get("/me", protectRoute(service), controller.me);
  return router;
}
