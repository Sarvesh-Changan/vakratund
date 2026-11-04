-- CreateTable
CREATE TABLE "HomeSlide" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "title" TEXT,
    "caption" TEXT,
    "linkUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL,
    "isPlaceholder" BOOLEAN NOT NULL DEFAULT false,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "license" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeSlide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomeSlide_isActive_sortOrder_idx" ON "HomeSlide"("isActive", "sortOrder");

-- AddForeignKey
ALTER TABLE "HomeSlide" ADD CONSTRAINT "HomeSlide_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

