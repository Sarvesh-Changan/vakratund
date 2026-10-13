CREATE TYPE "GalleryDesignType" AS ENUM ('INTERIOR', 'EXTERIOR');
CREATE TYPE "GalleryMediaType" AS ENUM ('IMAGE', 'VIDEO');

CREATE TABLE "GalleryCategory" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GalleryCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GalleryCategory_name_key" ON "GalleryCategory"("name");
CREATE UNIQUE INDEX "GalleryCategory_slug_key" ON "GalleryCategory"("slug");
CREATE INDEX "GalleryCategory_sortOrder_name_idx" ON "GalleryCategory"("sortOrder", "name");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "GalleryItem" old
    LEFT JOIN "MediaAsset" media ON media."id" = old."mediaId"
    WHERE media."id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Gallery migration stopped: a legacy GalleryItem has no related MediaAsset.';
  END IF;

  IF EXISTS (
    SELECT media."publicId"
    FROM "GalleryItem" old
    JOIN "MediaAsset" media ON media."id" = old."mediaId"
    GROUP BY media."publicId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Gallery migration stopped: duplicate legacy Cloudinary public IDs must be resolved before migration.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "GalleryItem" old
    JOIN "MediaAsset" media ON media."id" = old."mediaId"
    WHERE media."kind" NOT IN ('IMAGE'::"MediaKind", 'VIDEO'::"MediaKind")
  ) THEN
    RAISE EXCEPTION 'Gallery migration stopped: legacy gallery contains a non-image/video asset that must be resolved before migration.';
  END IF;
END $$;

-- A PostgreSQL primary-key constraint owns an index whose name is schema-wide.
-- Keep the legacy table's data, but free the canonical name for the replacement table.
ALTER TABLE "GalleryItem" RENAME CONSTRAINT "GalleryItem_pkey" TO "GalleryItem_legacy_pkey";
ALTER TABLE "GalleryItem" RENAME TO "GalleryItem_legacy";

CREATE TABLE "GalleryItem" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "designType" "GalleryDesignType" NOT NULL,
  "mediaType" "GalleryMediaType" NOT NULL,
  "publicId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "format" TEXT NOT NULL,
  "bytes" INTEGER NOT NULL,
  "etag" TEXT NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "duration" DOUBLE PRECISION,
  "isCategoryCover" BOOLEAN NOT NULL DEFAULT false,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GalleryItem_pkey" PRIMARY KEY ("id")
);

INSERT INTO "GalleryCategory" ("id", "name", "slug", "sortOrder", "createdAt", "updatedAt")
SELECT
  'cm' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
  'Existing Gallery',
  'existing-gallery',
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "GalleryItem_legacy");

INSERT INTO "GalleryItem" (
  "id", "title", "categoryId", "designType", "mediaType", "publicId", "url",
  "format", "bytes", "etag", "width", "height", "duration", "isCategoryCover",
  "isFeatured", "isPublished", "sortOrder", "createdAt", "updatedAt"
)
SELECT
  old."id",
  COALESCE(NULLIF(BTRIM(old."title"), ''), NULLIF(split_part(media."publicId", '/', array_length(string_to_array(media."publicId", '/'), 1)), ''), 'Gallery image'),
  category."id",
  'INTERIOR'::"GalleryDesignType",
  CASE WHEN media."kind" = 'VIDEO'::"MediaKind" THEN 'VIDEO'::"GalleryMediaType" ELSE 'IMAGE'::"GalleryMediaType" END,
  media."publicId",
  media."url",
  COALESCE(NULLIF(media."format", ''), CASE WHEN media."kind" = 'VIDEO'::"MediaKind" THEN 'mp4' ELSE 'jpg' END),
  COALESCE(media."bytes", 0),
  COALESCE(NULLIF(media."etag", ''), ''),
  media."width",
  media."height",
  NULL,
  false,
  false,
  old."isVisible",
  old."sortOrder",
  old."createdAt",
  old."updatedAt"
FROM "GalleryItem_legacy" old
JOIN "MediaAsset" media ON media."id" = old."mediaId"
CROSS JOIN "GalleryCategory" category
WHERE category."slug" = 'existing-gallery';

DROP TABLE "GalleryItem_legacy";

CREATE UNIQUE INDEX "GalleryItem_publicId_key" ON "GalleryItem"("publicId");
CREATE INDEX "GalleryItem_categoryId_sortOrder_idx" ON "GalleryItem"("categoryId", "sortOrder");
CREATE INDEX "GalleryItem_isPublished_isFeatured_idx" ON "GalleryItem"("isPublished", "isFeatured");
CREATE INDEX "GalleryItem_etag_idx" ON "GalleryItem"("etag");
CREATE INDEX "GalleryItem_designType_idx" ON "GalleryItem"("designType");

-- PostgreSQL partial unique index enforces the per-category cover invariant while allowing any number of non-cover items.
CREATE UNIQUE INDEX "GalleryItem_one_category_cover_idx" ON "GalleryItem"("categoryId") WHERE "isCategoryCover" = true;

ALTER TABLE "GalleryItem"
  ADD CONSTRAINT "GalleryItem_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "GalleryCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
