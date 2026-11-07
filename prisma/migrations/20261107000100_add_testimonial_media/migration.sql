-- CreateTable: TestimonialMedia
CREATE TABLE "TestimonialMedia" (
    "id"            TEXT NOT NULL,
    "testimonialId" TEXT NOT NULL,
    "mediaId"       TEXT NOT NULL,
    "thumbnailId"   TEXT,
    "sortOrder"     INTEGER NOT NULL DEFAULT 0,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestimonialMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TestimonialMedia_testimonialId_mediaId_key" ON "TestimonialMedia"("testimonialId", "mediaId");
CREATE INDEX "TestimonialMedia_testimonialId_sortOrder_idx" ON "TestimonialMedia"("testimonialId", "sortOrder");
CREATE INDEX "TestimonialMedia_mediaId_idx"      ON "TestimonialMedia"("mediaId");
CREATE INDEX "TestimonialMedia_thumbnailId_idx"  ON "TestimonialMedia"("thumbnailId");

-- AddForeignKey
ALTER TABLE "TestimonialMedia" ADD CONSTRAINT "TestimonialMedia_testimonialId_fkey"
    FOREIGN KEY ("testimonialId") REFERENCES "Testimonial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TestimonialMedia" ADD CONSTRAINT "TestimonialMedia_mediaId_fkey"
    FOREIGN KEY ("mediaId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TestimonialMedia" ADD CONSTRAINT "TestimonialMedia_thumbnailId_fkey"
    FOREIGN KEY ("thumbnailId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

