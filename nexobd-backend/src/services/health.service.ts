export class HealthService {
  private draining = false;
  beginShutdown() { this.draining = true; }
  isReady() { return !this.draining; }
  running() { return { status: "success", message: "NexoBD Backend Running" }; }
  liveness() { return { status: "ok", service: "nexobd-api" }; }
  readiness() {
    // Phase 2 adds a bounded PostgreSQL connectivity check here.
    return { status: this.isReady() ? "ready" : "unavailable", checks: { process: !this.draining } };
  }
}
