import "server-only";

import { unstable_cache } from "next/cache";

import type { GalleryDesignType, GalleryMediaType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";

export type PublishedGalleryItem = {
  id: string;
  title: string;
  categoryId: string;
  category: { name: string; slug: string };
  designType: GalleryDesignType;
  mediaType: GalleryMediaType;
  publicId: string;
  url: string;
  format: string;
  bytes: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  isFeatured: boolean;
  sortOrder: number;
};

export type PublishedGalleryCategory = {
  id: string;
  name: string;
  slug: string;
  cover: Pick<PublishedGalleryItem, "id" | "title" | "mediaType" | "url" | "publicId" | "width" | "height">;
};

export type GalleryLandingData = { categories: PublishedGalleryCategory[]; items: PublishedGalleryItem[] };

const publicItemSelect = {
  id: true,
  title: true,
  categoryId: true,
  category: { select: { name: true, slug: true } },
  designType: true,
  mediaType: true,
  publicId: true,
  url: true,
  format: true,
  bytes: true,
  width: true,
  height: true,
  duration: true,
  isFeatured: true,
  sortOrder: true,
} satisfies Prisma.GalleryItemSelect;

async function readPublishedGallery(categorySlug?: string, designType?: GalleryDesignType): Promise<PublishedGalleryItem[]> {
  const rows = await prisma.galleryItem.findMany({
    where: { isPublished: true, ...(categorySlug ? { category: { is: { slug: categorySlug } } } : {}), ...(designType ? { designType } : {}) },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { createdAt: "asc" }],
    take: 1000,
    select: publicItemSelect,
  });
  return rows;
}

export function getPublishedGallery(categorySlug?: string, designType?: GalleryDesignType): Promise<PublishedGalleryItem[]> {
  const tags = ["gallery", ...(categorySlug ? [`gallery:category:${categorySlug}`] : [])];
  return unstable_cache(() => readPublishedGallery(categorySlug, designType), ["published-gallery", categorySlug ?? "all", designType ?? "all"], { tags, revalidate: 3600 })();
}

async function readGalleryLandingData(designType?: GalleryDesignType): Promise<GalleryLandingData> {
  const [items, categories] = await Promise.all([
    readPublishedGallery(undefined, designType),
    prisma.galleryCategory.findMany({
      where: { items: { some: { isPublished: true, ...(designType ? { designType } : {}) } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        items: {
          where: { isPublished: true, ...(designType ? { designType } : {}) },
          orderBy: [{ isCategoryCover: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
          take: 1,
          select: { id: true, title: true, mediaType: true, url: true, publicId: true, width: true, height: true },
        },
      },
    }),
  ]);
  return { items, categories: categories.flatMap(({ items: covers, ...category }) => covers[0] ? [{ ...category, cover: covers[0] }] : []) };
}

export function getGalleryLandingData(designType?: GalleryDesignType): Promise<GalleryLandingData> {
  return unstable_cache(() => readGalleryLandingData(designType), ["gallery-landing", designType ?? "all"], { tags: ["gallery"], revalidate: 3600 })();
}

export function getFeaturedGallery(limit = 6): Promise<PublishedGalleryItem[]> {
  const safeLimit = Math.min(12, Math.max(1, Math.floor(limit)));
  return unstable_cache(async () => prisma.galleryItem.findMany({
    where: { isPublished: true, isFeatured: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: safeLimit,
    select: publicItemSelect,
  }), ["featured-gallery", String(safeLimit)], { tags: ["gallery"], revalidate: 3600 })();
}
