import { z } from "zod";
import { Prisma } from "../prisma/generated/client.js";

export const moneySchema = z.union([z.string(), z.number().finite()]).transform(String)
  .pipe(z.string().regex(/^\d{1,12}(\.\d{1,2})?$/)).transform((value) => new Prisma.Decimal(value).toFixed(2));
const imageUrl = z.string().max(2048).url().refine((value) => {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && !url.hash; }
  catch { return false; }
});
const slug = (length: number) => z.string().max(length).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const uuid = z.string().uuid().transform((value) => value.toLowerCase());
export const idSchema = z.object({ id: uuid }).strict();
export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(120), slug: slug(160).optional(),
  image: imageUrl.nullable().optional(), description: z.string().trim().max(10000).nullable().optional(),
}).strict();
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict();
const productFieldsSchema = z.object({
  name: z.string().trim().min(1).max(200), slug: slug(240).optional(),
  description: z.string().trim().min(1).max(50000), price: moneySchema,
  discountPrice: moneySchema.nullable().optional(), stock: z.number().int().min(0).max(2147483647).default(0),
  brand: z.string().trim().min(1).max(120).nullable().optional(), categoryId: uuid,
  images: z.array(imageUrl).max(10).refine((items) => new Set(items).size === items.length).default([]),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
}).strict();
export const productCreateSchema = productFieldsSchema.refine((value) => !value.discountPrice || new Prisma.Decimal(value.discountPrice).lte(value.price), { path: ["discountPrice"] });
export const productUpdateSchema = productFieldsSchema.omit({ stock: true, images: true, status: true }).partial().extend({
  stock: productFieldsSchema.shape.stock.removeDefault().optional(),
  images: productFieldsSchema.shape.images.removeDefault().optional(),
  status: productFieldsSchema.shape.status.removeDefault().optional(),
}).refine((value) => Object.keys(value).length > 0);
export type CategoryCreate = z.infer<typeof categoryCreateSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type ProductCreate = z.infer<typeof productCreateSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;
