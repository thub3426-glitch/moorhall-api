-- Add imagePublicId and images columns to MenuItem table
-- These columns were added to the Prisma schema but were missing from the database
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "imagePublicId" TEXT;
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "images" JSONB;

-- Add imagePublicId to ServiceItem table
ALTER TABLE "ServiceItem" ADD COLUMN IF NOT EXISTS "imagePublicId" TEXT;

-- Add imagePublicId to GalleryItem table
ALTER TABLE "GalleryItem" ADD COLUMN IF NOT EXISTS "imagePublicId" TEXT;

-- Add images to CateringRequest table
ALTER TABLE "CateringRequest" ADD COLUMN IF NOT EXISTS "images" JSONB;
