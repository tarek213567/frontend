import bcrypt from "bcrypt";
import { ApiError } from "./api-error.js";

export async function hashPassword(password: string, rounds: number) {
  if (Buffer.byteLength(password, "utf8") > 72) throw new ApiError(400, "VALIDATION_ERROR", "Password exceeds byte limit");
  return bcrypt.hash(password, rounds);
}
export function verifyPassword(password: string, hash: string) { return bcrypt.compare(password, hash); }
