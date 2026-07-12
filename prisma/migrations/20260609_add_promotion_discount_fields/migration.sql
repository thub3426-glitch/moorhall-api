-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN "imagePublicId" TEXT,
ADD COLUMN "discountPercentage" INTEGER,
ADD COLUMN "originalPrice" DECIMAL(10,2),
ADD COLUMN "discountedPrice" DECIMAL(10,2),
ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0;
