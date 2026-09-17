import type { PrismaClient, Prisma, Product } from "../prisma/generated/client.js";
import type { ProductCreate, ProductUpdate, Pagination } from "../models/catalog.schema.js";
import { databaseError } from "../utils/database-error.js";

export class ProductRepository {
  constructor(private readonly db: PrismaClient) {}
  async create(input: ProductCreate & { slug: string }) {
    try { return await this.db.product.create({ data: input, include: { category: true } }); }
    catch (error) { databaseError(error); }
  }
  list(query: Pagination) {
    const where = { deletedAt: null, status: "ACTIVE" as const };
    return this.db.$transaction(async (tx) => ({
      items: await tx.product.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }], include: { category: true } }),
      total: await tx.product.count({ where }),
    }), { isolationLevel: "RepeatableRead" });
  }
  get(id: string) {
    return this.db.product.findFirst({ where: { id, deletedAt: null, status: "ACTIVE" }, include: { category: true } });
  }
  async mutate<T>(id: string, action: (tx: Prisma.TransactionClient, product: Product) => Promise<T>) {
    try {
      return await this.db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM products WHERE id = ${id}::uuid FOR UPDATE`;
        const product = await tx.product.findUnique({ where: { id } });
        if (!product || product.deletedAt) return null;
        return action(tx, product);
      });
    } catch (error) { databaseError(error); }
  }
  update(tx: Prisma.TransactionClient, id: string, input: ProductUpdate & { deletedAt?: Date }) {
    return tx.product.update({ where: { id }, data: { ...input, version: { increment: 1 } }, include: { category: true } });
  }
}
