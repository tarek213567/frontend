import type { CategoryService } from "../services/category.service.js";
import type { ProductService } from "../services/product.service.js";
export interface CatalogServices { categories: CategoryService; products: ProductService }
