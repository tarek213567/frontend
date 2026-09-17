import type { CookieOptions, Request, RequestHandler, Response } from "express";
import type { Environment } from "../config/env.js";
import type { AuthService } from "../services/auth.service.js";
import type { AuthResponse } from "../types/auth.js";
import { ApiError } from "../utils/api-error.js";

export class AuthController {
  private readonly cookieName = "nexobd-refresh";
  constructor(private readonly service: AuthService, private readonly env: Environment) {}
  private cookieOptions(): CookieOptions {
    return { httpOnly: true, secure: this.env.NODE_ENV === "production", sameSite: this.env.AUTH_COOKIE_SAME_SITE, path: "/api/auth" };
  }
  private send(res: Response, result: AuthResponse, status = 200) {
    if (!this.env.AUTH_COOKIE_ENABLED) return res.status(status).json(result);
    res.cookie(this.cookieName, result.refreshToken, { ...this.cookieOptions(), expires: result.refreshExpiresAt });
    const { refreshToken: _token, ...body } = result;
    return res.status(status).json(body);
  }
  private token(req: Request, res: Response) {
    let value: unknown;
    if (this.env.AUTH_COOKIE_ENABLED) {
      const entry = req.headers.cookie?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${this.cookieName}=`));
      value = entry?.slice(this.cookieName.length + 1);
    } else value = (res.locals.validatedBody as { refreshToken?: string }).refreshToken;
    if (typeof value !== "string" || !/^[A-Za-z0-9_-]{64}$/.test(value)) throw new ApiError(401, "INVALID_REFRESH_TOKEN", "A valid refresh token is required");
    return value;
  }
  register: RequestHandler = async (_req, res) => { this.send(res, await this.service.register(res.locals.validatedBody), 201); };
  login: RequestHandler = async (_req, res) => { this.send(res, await this.service.login(res.locals.validatedBody)); };
  refresh: RequestHandler = async (req, res) => {
    try { this.send(res, await this.service.refresh(this.token(req, res))); }
    catch (error) {
      if (error instanceof ApiError && error.status === 401 && this.env.AUTH_COOKIE_ENABLED) res.clearCookie(this.cookieName, this.cookieOptions());
      throw error;
    }
  };
  logout: RequestHandler = async (req, res) => {
    // Unknown tokens are idempotent; missing/malformed credentials still return 401.
    await this.service.logout(this.token(req, res));
    if (this.env.AUTH_COOKIE_ENABLED) res.clearCookie(this.cookieName, this.cookieOptions());
    res.json({ success: true, message: "Logged out" });
  };
  me: RequestHandler = (req, res) => {
    if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    const { sessionId: _sessionId, ...user } = req.user;
    res.json({ success: true, user });
  };
}
