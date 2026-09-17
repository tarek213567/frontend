import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(12).max(72).refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Password exceeds bcrypt's byte limit");
export const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email,
  phone: z.string().trim().regex(/^\+?[0-9]{7,15}$/).optional(),
  password,
}).strict();
export const loginSchema = z.object({ email, password: z.string().min(1).max(72)
  .refine((value) => Buffer.byteLength(value, "utf8") <= 72) }).strict();
export const refreshSchema = z.object({ refreshToken: z.string().regex(/^[A-Za-z0-9_-]{64}$/).optional() }).strict();
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
