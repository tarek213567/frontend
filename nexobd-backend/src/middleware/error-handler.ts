import type { ErrorRequestHandler } from "express";
import type { Logger } from "pino";
import { ApiError } from "../utils/api-error.js";

export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (error: unknown, _req, res, next) => {
    if (res.headersSent) return next(error);
    const bodyError = error as { type?: string } | null;
    const known = error instanceof ApiError ? error
      : bodyError?.type === "entity.parse.failed" ? new ApiError(400, "INVALID_JSON", "Malformed JSON body")
      : bodyError?.type === "entity.too.large" ? new ApiError(413, "PAYLOAD_TOO_LARGE", "Request body is too large") : null;
    if (!known) logger.error({ requestId: res.locals.requestId }, "Unhandled request error");
    res.status(known?.status ?? 500).json({ error: {
      code: known?.code ?? "INTERNAL_ERROR",
      message: known?.message ?? "An unexpected error occurred",
      requestId: res.locals.requestId,
    } });
  };
}
