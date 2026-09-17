import { randomBytes } from "node:crypto";
import type { Environment } from "../config/env.js";
import type { AuthRepository, SessionResult } from "../repositories/auth.repository.js";
import type { LoginInput, RegisterInput } from "../models/auth.schema.js";
import type { AuthResponse, SafeUser } from "../types/auth.js";
import type { User } from "../prisma/generated/client.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { createRefreshToken, hashRefreshToken, signAccessToken, verifyAccessToken } from "../utils/jwt.js";
import { ApiError } from "../utils/api-error.js";

export function safeUser(user: User): SafeUser {
  const { id, name, email, phone, role, avatar, createdAt, updatedAt } = user;
  return { id, name, email, phone, role, avatar, createdAt, updatedAt };
}
export class AuthService {
  private readonly dummyHash: Promise<string>;
  constructor(private readonly repo: AuthRepository, private readonly env: Environment) {
    this.dummyHash = hashPassword(randomBytes(32).toString("hex"), env.BCRYPT_ROUNDS);
  }
  private expiration() { return new Date(Date.now() + this.env.REFRESH_TOKEN_TTL_DAYS * 86400000); }
  private response(session: SessionResult, refreshToken: string): AuthResponse {
    return { success: true, user: safeUser(session.user), accessToken: signAccessToken(session.user.id, session.sessionId, this.env), refreshToken,
      expiresIn: this.env.ACCESS_TOKEN_TTL_SECONDS, refreshExpiresAt: session.expiresAt };
  }
  async register(input: RegisterInput) {
    if (await this.repo.findByEmail(input.email)) throw new ApiError(409, "EMAIL_EXISTS", "Email is already registered");
    const passwordHash = await hashPassword(input.password, this.env.BCRYPT_ROUNDS);
    const token = createRefreshToken();
    return this.response(await this.repo.register(input, passwordHash, hashRefreshToken(token), this.expiration()), token);
  }
  async login(input: LoginInput) {
    const user = await this.repo.findByEmail(input.email);
    const matches = await verifyPassword(input.password, user?.password ?? await this.dummyHash);
    if (!user || !matches) throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
    const token = createRefreshToken();
    return this.response(await this.repo.createSession(user.id, hashRefreshToken(token), this.expiration()), token);
  }
  async refresh(token: string) {
    const next = createRefreshToken();
    const session = await this.repo.rotate(hashRefreshToken(token), hashRefreshToken(next), new Date());
    if (!session) throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Invalid or expired refresh token");
    return this.response(session, next);
  }
  async logout(token: string) { await this.repo.revoke(hashRefreshToken(token), new Date()); }
  async authenticate(token: string) {
    const claims = verifyAccessToken(token, this.env);
    // Current database role is authoritative; revoked sessions invalidate access immediately.
    const user = await this.repo.activeSession(claims.sid, claims.sub, new Date());
    if (!user) throw new ApiError(401, "UNAUTHORIZED", "Session is no longer active");
    return { ...safeUser(user), sessionId: claims.sid };
  }
}
