import { Router } from "express";
import type { AuthService } from "../services/auth.service.js";
import type { ProductService } from "../services/product.service.js";
import { ProductController } from "../controllers/product.controller.js";
import { protectRoute, authorizeRoles } from "../middleware/auth.middleware.js";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.js";
import { productCreateSchema, productUpdateSchema, paginationSchema, idSchema } from "../models/catalog.schema.js";

export function createProductRoutes(service: ProductService, auth: AuthService) {
  const router = Router(), controller = new ProductController(service);
  const admin = [protectRoute(auth), authorizeRoles("ADMIN")];
  router.get("/", validateQuery(paginationSchema), controller.list);
  router.get("/:id", validateParams(idSchema), controller.get);
  router.post("/", ...admin, validateBody(productCreateSchema), controller.create);
  router.put("/:id", ...admin, validateParams(idSchema), validateBody(productUpdateSchema), controller.update);
  router.delete("/:id", ...admin, validateParams(idSchema), controller.delete);
  return router;
}
