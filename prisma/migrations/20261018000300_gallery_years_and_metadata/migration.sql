-- This migration is data-preserving but changes the GalleryItem contract.
-- Existing rows are assigned to the calendar year of createdAt before the
-- required GalleryYear foreign key is enforced.

CREATE TABLE "GalleryYear" (
  "id" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GalleryYear_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GalleryYear_year_key" ON "GalleryYear"("year");
CREATE INDEX "GalleryYear_year_idx" ON "GalleryYear"("year");

ALTER TABLE "GalleryItem"
  ADD COLUMN "yearId" TEXT,
  ADD COLUMN "caption" TEXT,
  ADD COLUMN "alt" TEXT;

INSERT INTO "GalleryYear" ("id", "year")
SELECT
  'cgy' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
  EXTRACT(YEAR FROM "createdAt")::INTEGER
FROM "GalleryItem"
GROUP BY EXTRACT(YEAR FROM "createdAt")::INTEGER
ON CONFLICT ("year") DO NOTHING;

UPDATE "GalleryItem" item
SET "yearId" = year."id"
FROM "GalleryYear" year
WHERE year."year" = EXTRACT(YEAR FROM item."createdAt")::INTEGER;

UPDATE "GalleryItem"
SET "alt" = COALESCE(NULLIF(BTRIM("title"), ''), 'Gallery item');

ALTER TABLE "GalleryItem"
  ALTER COLUMN "yearId" SET NOT NULL,
  ALTER COLUMN "alt" SET NOT NULL;

ALTER TABLE "GalleryItem"
  ADD CONSTRAINT "GalleryItem_yearId_fkey"
  FOREIGN KEY ("yearId") REFERENCES "GalleryYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "GalleryItem_designType_idx";
ALTER TABLE "GalleryItem" DROP COLUMN "designType";
DROP TYPE IF EXISTS "GalleryDesignType";

DROP INDEX IF EXISTS "GalleryItem_categoryId_sortOrder_idx";
CREATE INDEX "GalleryItem_categoryId_yearId_sortOrder_idx" ON "GalleryItem"("categoryId", "yearId", "sortOrder");
CREATE INDEX "GalleryItem_yearId_idx" ON "GalleryItem"("yearId");
