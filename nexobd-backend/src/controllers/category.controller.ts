import type { RequestHandler } from "express";
import type { CategoryService } from "../services/category.service.js";
export class CategoryController {
  constructor(private readonly service: CategoryService) {}
  list: RequestHandler = async (_req, res) => { res.json(await this.service.list(res.locals.validatedQuery)); };
  create: RequestHandler = async (_req, res) => { res.status(201).json({ data: await this.service.create(res.locals.validatedBody) }); };
}
