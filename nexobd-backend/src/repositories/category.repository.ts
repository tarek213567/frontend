import type { PrismaClient } from "../prisma/generated/client.js";
import type { CategoryCreate, Pagination } from "../models/catalog.schema.js";
import { databaseError } from "../utils/database-error.js";
export class CategoryRepository {
  constructor(private readonly db: PrismaClient) {}
  list(query: Pagination) {
    return this.db.$transaction(async (tx) => ({
      items: await tx.category.findMany({ skip: (query.page - 1) * query.limit, take: query.limit, orderBy: [{ name: "asc" }, { id: "asc" }] }),
      total: await tx.category.count(),
    }), { isolationLevel: "RepeatableRead" });
  }
  async create(input: CategoryCreate & { slug: string }) {
    try { return await this.db.category.create({ data: input }); } catch (error) { databaseError(error); }
  }
}
