-- AlterTable
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE "products" ADD COLUMN     "deletedAt" TIMESTAMPTZ(3),
ADD COLUMN     "sellerId" UUID,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "products_sellerId_deletedAt_createdAt_idx" ON "products"("sellerId", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "products_deletedAt_status_createdAt_idx" ON "products"("deletedAt", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "products"
  ADD CONSTRAINT "products_version_nonnegative" CHECK ("version" >= 0),
  ADD CONSTRAINT "products_deleted_archived" CHECK ("deletedAt" IS NULL OR "status" = 'ARCHIVED');

CREATE INDEX "products_name_trgm_idx" ON "products" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "products_description_trgm_idx" ON "products" USING GIN ("description" gin_trgm_ops);
CREATE INDEX "products_brand_trgm_idx" ON "products" USING GIN ("brand" gin_trgm_ops);
