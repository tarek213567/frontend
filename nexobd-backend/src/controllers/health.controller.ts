import type { RequestHandler } from "express";
import { HealthService } from "../services/health.service.js";
export class HealthController {
  constructor(private readonly service: HealthService) {}
  running: RequestHandler = (_req, res) => { res.json(this.service.running()); };
  live: RequestHandler = (_req, res) => { res.json({ data: this.service.liveness() }); };
  ready: RequestHandler = (_req, res) => {
    res.status(this.service.isReady() ? 200 : 503).json({ data: this.service.readiness() });
  };
}
