import { randomUUID } from "node:crypto";
import type { PrismaClient, User } from "../prisma/generated/client.js";
import { ApiError } from "../utils/api-error.js";
import type { RegisterInput } from "../models/auth.schema.js";

export interface SessionResult { user: User; sessionId: string; expiresAt: Date }
export interface AuthRepository {
  findByEmail(email: string): Promise<User | null>;
  register(input: RegisterInput, passwordHash: string, tokenHash: string, expiresAt: Date): Promise<SessionResult>;
  createSession(userId: string, tokenHash: string, expiresAt: Date): Promise<SessionResult>;
  rotate(tokenHash: string, nextHash: string, now: Date): Promise<SessionResult | null>;
  revoke(tokenHash: string, now: Date): Promise<void>;
  activeSession(sessionId: string, userId: string, now: Date): Promise<User | null>;
}

export class PrismaAuthRepository implements AuthRepository {
  constructor(private readonly db: PrismaClient) {}
  findByEmail(email: string) { return this.db.user.findUnique({ where: { email } }); }
  async register(input: RegisterInput, passwordHash: string, tokenHash: string, expiresAt: Date) {
    try {
      return await this.db.$transaction(async (tx) => {
        const user = await tx.user.create({ data: { name: input.name, email: input.email, phone: input.phone, password: passwordHash, role: "CUSTOMER" } });
        const session = await tx.authSession.create({ data: { userId: user.id, expiresAt, tokens: { create: { tokenHash } } } });
        return { user, sessionId: session.id, expiresAt };
      });
    } catch (error) {
      if ((error as { code?: string }).code === "P2002") throw new ApiError(409, "EMAIL_EXISTS", "Email is already registered");
      throw error;
    }
  }
  async createSession(userId: string, tokenHash: string, expiresAt: Date) {
    const session = await this.db.authSession.create({
      data: { userId, expiresAt, tokens: { create: { tokenHash } } }, include: { user: true },
    });
    return { user: session.user, sessionId: session.id, expiresAt };
  }
  async rotate(tokenHash: string, nextHash: string, now: Date) {
    return this.db.$transaction(async (tx) => {
      const token = await tx.refreshToken.findUnique({ where: { tokenHash } });
      if (!token) return null;
      // Serialize refresh/logout operations on this family, including concurrent reuse.
      await tx.$queryRaw`SELECT id FROM auth_sessions WHERE id = ${token.sessionId}::uuid FOR UPDATE`;
      const session = await tx.authSession.findUnique({ where: { id: token.sessionId }, include: { user: true } });
      const current = await tx.refreshToken.findUnique({ where: { id: token.id } });
      if (!session || !current || session.revokedAt || session.expiresAt <= now) return null;
      if (current.usedAt) {
        // Return after committing revocation; throwing here would roll it back.
        await tx.authSession.update({ where: { id: session.id }, data: { revokedAt: now } });
        return null;
      }
      await tx.refreshToken.update({ where: { id: token.id }, data: { usedAt: now } });
      await tx.refreshToken.create({ data: { id: randomUUID(), sessionId: session.id, tokenHash: nextHash } });
      return { user: session.user, sessionId: session.id, expiresAt: session.expiresAt };
    });
  }
  async revoke(tokenHash: string, now: Date) {
    await this.db.$transaction(async (tx) => {
      const token = await tx.refreshToken.findUnique({ where: { tokenHash } });
      if (!token) return;
      await tx.$queryRaw`SELECT id FROM auth_sessions WHERE id = ${token.sessionId}::uuid FOR UPDATE`;
      await tx.authSession.updateMany({ where: { id: token.sessionId, revokedAt: null }, data: { revokedAt: now } });
    });
  }
  async activeSession(sessionId: string, userId: string, now: Date) {
    const session = await this.db.authSession.findFirst({ where: { id: sessionId, userId, revokedAt: null, expiresAt: { gt: now } }, include: { user: true } });
    return session?.user ?? null;
  }
}
