ALTER TABLE "MediaAsset" ADD COLUMN "etag" TEXT;

CREATE INDEX "MediaAsset_etag_idx" ON "MediaAsset"("etag");

ALTER TABLE "Testimonial" ADD COLUMN "photoId" TEXT;

CREATE INDEX "Testimonial_photoId_idx" ON "Testimonial"("photoId");

ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_photoId_fkey"
  FOREIGN KEY ("photoId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
