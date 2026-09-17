import { authPaths } from "./auth.openapi.js";
export const openapi = {
  openapi: "3.0.3",
  info: { title: "NexoBD API", version: "0.3.0", description: "Health and authentication." },
  components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } } },
  servers: [{ url: "/api/v1" }],
  paths: { ...authPaths, ...Object.fromEntries(["live", "ready"].map((kind) => [`/health/${kind}`, {
    get: {
      tags: ["Health"], summary: kind === "live" ? "Process liveness" : "Process readiness (draining state)",
      responses: {
        "200": { description: "Healthy", content: { "application/json": { schema: {
          type: "object", properties: { data: { type: "object", properties: { status: { type: "string" } } } },
        } } } },
        ...(kind === "ready" ? { "503": { description: "Process is shutting down" } } : {}),
      },
    },
  }])) },
};
