import type { RequestHandler } from "express";
import type { AuthService } from "../services/auth.service.js";
import type { UserRole } from "../types/auth.js";
import { ApiError } from "../utils/api-error.js";

export function protectRoute(service: AuthService): RequestHandler {
  return async (req, _res, next) => {
    const match = req.headers.authorization?.match(/^Bearer ([^\s]+)$/i);
    if (!match?.[1] || match[1].length > 4096) throw new ApiError(401, "UNAUTHORIZED", "A bearer access token is required");
    req.user = await service.authenticate(match[1]);
    next();
  };
}
export function authorizeRoles(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Authentication is required");
    if (!roles.includes(req.user.role)) throw new ApiError(403, "FORBIDDEN", "You do not have permission to access this resource");
    next();
  };
}
