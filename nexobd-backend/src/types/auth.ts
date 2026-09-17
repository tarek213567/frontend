import type { Role, User } from "../prisma/generated/client.js";

export type SafeUser = Pick<User, "id" | "name" | "email" | "phone" | "role" | "avatar" | "createdAt" | "updatedAt">;
export type AuthenticatedUser = SafeUser & { sessionId: string };
export interface AuthResponse { success: true; user: SafeUser; accessToken: string; refreshToken: string; expiresIn: number; refreshExpiresAt: Date }
export type UserRole = Role;

declare global {
  namespace Express {
    interface Request { user?: AuthenticatedUser }
  }
}
