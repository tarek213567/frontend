import { Prisma, type Product, type Category } from "../prisma/generated/client.js";
import type { ProductRepository } from "../repositories/product.repository.js";
import type { ProductCreate, ProductUpdate, Pagination } from "../models/catalog.schema.js";
import type { AuthenticatedUser } from "../types/auth.js";
import { createSlug } from "../utils/slug.js";
import { ApiError } from "../utils/api-error.js";

function requireAdmin(actor: AuthenticatedUser) {
  if (actor.role !== "ADMIN") throw new ApiError(403, "FORBIDDEN", "Only admins can manage products");
}
function productView(product: Product & { category: Category }) {
  const { id, name, slug, description, stock, brand, images, status, categoryId, createdAt, updatedAt, category } = product;
  return { id, name, slug, description, price: product.price.toFixed(2),
    discountPrice: product.discountPrice?.toFixed(2) ?? null, stock, brand, images, status,
    categoryId, createdAt, updatedAt, category };
}
export class ProductService {
  constructor(private readonly repo: ProductRepository) {}
  async create(input: ProductCreate, actor: AuthenticatedUser) {
    requireAdmin(actor);
    return productView(await this.repo.create({ ...input, slug: input.slug ?? createSlug(input.name, 240) }));
  }
  async list(query: Pagination) {
    const result = await this.repo.list(query);
    return { data: result.items.map(productView), pagination: {
      page: query.page, limit: query.limit, total: result.total, totalPages: Math.ceil(result.total / query.limit),
    } };
  }
  async get(id: string) {
    const product = await this.repo.get(id);
    if (!product) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");
    return productView(product);
  }
  async update(id: string, input: ProductUpdate, actor: AuthenticatedUser) {
    requireAdmin(actor);
    const updated = await this.repo.mutate(id, async (tx, product) => {
      const price = new Prisma.Decimal(input.price ?? product.price);
      const discount = input.discountPrice === undefined ? product.discountPrice
        : input.discountPrice === null ? null : new Prisma.Decimal(input.discountPrice);
      if (discount?.gt(price)) throw new ApiError(400, "INVALID_DISCOUNT", "Discount price cannot exceed regular price");
      return this.repo.update(tx, id, input);
    });
    if (!updated) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");
    return productView(updated);
  }
  async delete(id: string, actor: AuthenticatedUser) {
    requireAdmin(actor);
    const updated = await this.repo.mutate(id, (tx) => this.repo.update(tx, id, { status: "ARCHIVED", deletedAt: new Date() }));
    if (!updated) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }
}
