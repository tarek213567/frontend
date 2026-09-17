import type { CategoryRepository } from "../repositories/category.repository.js";
import type { CategoryCreate, Pagination } from "../models/catalog.schema.js";
import { createSlug } from "../utils/slug.js";
export class CategoryService {
  constructor(private readonly repo: CategoryRepository) {}
  async list(query: Pagination) {
    const result = await this.repo.list(query);
    return { data: result.items, pagination: { ...query, total: result.total, totalPages: Math.ceil(result.total / query.limit) } };
  }
  create(input: CategoryCreate) { return this.repo.create({ ...input, slug: input.slug ?? createSlug(input.name, 160) }); }
}
