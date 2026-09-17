import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { ApiError } from "../utils/api-error.js";

export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return next(new ApiError(400, "VALIDATION_ERROR", "Request body is invalid"));
    res.locals.validatedBody = result.data;
    next();
  };
}
export function validateParams<T>(schema: ZodType<T>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) return next(new ApiError(400, "VALIDATION_ERROR", "Route parameters are invalid"));
    res.locals.validatedParams = result.data;
    next();
  };
}
export function validateQuery<T>(schema: ZodType<T>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) return next(new ApiError(400, "VALIDATION_ERROR", "Query parameters are invalid"));
    res.locals.validatedQuery = result.data;
    next();
  };
}
