import { Router } from "express";
import type { AuthService } from "../services/auth.service.js";
import type { CategoryService } from "../services/category.service.js";
import { CategoryController } from "../controllers/category.controller.js";
import { protectRoute, authorizeRoles } from "../middleware/auth.middleware.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { categoryCreateSchema, paginationSchema } from "../models/catalog.schema.js";
export function createCategoryRoutes(service: CategoryService, auth: AuthService) {
  const router = Router(), controller = new CategoryController(service);
  router.get("/", validateQuery(paginationSchema), controller.list);
  router.post("/", protectRoute(auth), authorizeRoles("ADMIN"), validateBody(categoryCreateSchema), controller.create);
  return router;
}
