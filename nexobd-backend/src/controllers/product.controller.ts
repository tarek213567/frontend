import type { Request, RequestHandler } from "express";
import type { ProductService } from "../services/product.service.js";
import { ApiError } from "../utils/api-error.js";
function actor(req: Request) {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  return req.user;
}
export class ProductController {
  constructor(private readonly service: ProductService) {}
  list: RequestHandler = async (_req, res) => { res.json(await this.service.list(res.locals.validatedQuery)); };
  get: RequestHandler = async (_req, res) => { res.json({ data: await this.service.get(res.locals.validatedParams.id) }); };
  create: RequestHandler = async (req, res) => { res.status(201).json({ data: await this.service.create(res.locals.validatedBody, actor(req)) }); };
  update: RequestHandler = async (req, res) => { res.json({ data: await this.service.update(res.locals.validatedParams.id, res.locals.validatedBody, actor(req)) }); };
  delete: RequestHandler = async (req, res) => { await this.service.delete(res.locals.validatedParams.id, actor(req)); res.status(204).end(); };
}
