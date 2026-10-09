import "server-only";

import { unstable_cache } from "next/cache";

import type { MediaKind, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";

export type PublishedGalleryItem = {
  id: string;
  category: string;
  title: string | null;
  sortOrder: number;
  media: { id: string; kind: MediaKind; url: string; alt: string; width: number | null; height: number | null };
};

const gallerySelect = {
  id: true,
  mediaId: true,
  category: true,
  title: true,
  sortOrder: true,
} satisfies Prisma.GalleryItemSelect;

async function readPublishedGallery(category?: string): Promise<PublishedGalleryItem[]> {
  const rows = await prisma.galleryItem.findMany({ where: { isVisible: true, ...(category ? { category } : {}) }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: gallerySelect });
  if (rows.length === 0) return [];
  const media = await prisma.mediaAsset.findMany({ where: { id: { in: rows.map((row) => row.mediaId) } }, select: { id: true, kind: true, url: true, alt: true, width: true, height: true } });
  const mediaById = new Map(media.map((asset) => [asset.id, asset]));
  return rows.flatMap((row) => {
    const asset = mediaById.get(row.mediaId);
    return asset ? [{ id: row.id, category: row.category, title: row.title, sortOrder: row.sortOrder, media: asset }] : [];
  });
}

export function getPublishedGallery(category?: string): Promise<PublishedGalleryItem[]> {
  return unstable_cache(() => readPublishedGallery(category), ["published-gallery", category ?? "all"], { tags: ["gallery"], revalidate: 3600 })();
}

