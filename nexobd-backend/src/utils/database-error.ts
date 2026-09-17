import { ApiError } from "./api-error.js";
export function databaseError(error: unknown): never {
  const code = (error as { code?: string }).code;
  if (code === "P2002") throw new ApiError(409, "ALREADY_EXISTS", "A record with this unique value already exists");
  if (code === "P2003") throw new ApiError(409, "RELATION_CONFLICT", "Related records prevent this operation");
  if (code === "P2025") throw new ApiError(404, "NOT_FOUND", "Record not found");
  if (code === "P2034") throw new ApiError(409, "WRITE_CONFLICT", "Concurrent change detected; reload and retry");
  throw error;
}
