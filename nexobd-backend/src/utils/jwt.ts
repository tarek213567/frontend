import jwt from "jsonwebtoken";
import { randomBytes, createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import type { Environment } from "../config/env.js";
import { ApiError } from "./api-error.js";

const claimsSchema = z.object({ sub: z.string().uuid(), sid: z.string().uuid(), type: z.literal("access"), exp: z.number(), iat: z.number(), jti: z.string().uuid() });
export type AccessClaims = z.infer<typeof claimsSchema>;
export function signAccessToken(userId: string, sessionId: string, env: Environment) {
  return jwt.sign({ sid: sessionId, type: "access" }, env.JWT_ACCESS_SECRET, {
    algorithm: "HS256", expiresIn: env.ACCESS_TOKEN_TTL_SECONDS, issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE, subject: userId, jwtid: randomUUID(),
  });
}
export function verifyAccessToken(token: string, env: Environment): AccessClaims {
  try {
    const claims = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"], issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE,
      maxAge: env.ACCESS_TOKEN_TTL_SECONDS,
    });
    return claimsSchema.parse(claims);
  } catch { throw new ApiError(401, "UNAUTHORIZED", "Invalid or expired access token"); }
}
export function createRefreshToken() { return randomBytes(48).toString("base64url"); }
export function hashRefreshToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
