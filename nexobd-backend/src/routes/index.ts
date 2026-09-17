import { Router } from "express";
import { HealthController } from "../controllers/health.controller.js";
import { HealthService } from "../services/health.service.js";
export function createRoutes(health: HealthService) {
  const router = Router();
  const controller = new HealthController(health);
  router.get("/health", controller.running);
  router.get("/health/live", controller.live);
  router.get("/health/ready", controller.ready);
  return router;
}
