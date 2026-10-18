import "server-only";

import { unstable_cache } from "next/cache";
import type { GalleryMediaType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";

export type PublishedGalleryItem = { id: string; title: string; categoryId: string; category: { name: string; slug: string }; yearId: string; year: number; mediaType: GalleryMediaType; publicId: string; url: string; format: string; bytes: number; width: number | null; height: number | null; duration: number | null; caption: string | null; alt: string; isFeatured: boolean; sortOrder: number };
export type PublishedGalleryCategory = { id: string; name: string; slug: string; count: number; cover: Pick<PublishedGalleryItem, "id" | "title" | "mediaType" | "url" | "publicId" | "width" | "height" | "alt"> };
export type PublishedGalleryYear = { id: string; year: number; count: number };
export type GalleryFilterCounts = { categories: Record<string, number>; years: Record<string, number> };
export type GalleryLandingData = { categories: PublishedGalleryCategory[]; years: PublishedGalleryYear[]; items: PublishedGalleryItem[]; counts: GalleryFilterCounts };

const publicSelect = {
  id: true, title: true, categoryId: true,
  category: { select: { name: true, slug: true } },
  yearId: true, year: { select: { year: true } },
  mediaType: true, publicId: true, url: true, format: true, bytes: true,
  width: true, height: true, duration: true, caption: true, alt: true,
  isFeatured: true, sortOrder: true,
} satisfies Prisma.GalleryItemSelect;
type PublicRecord = Prisma.GalleryItemGetPayload<{ select: typeof publicSelect }>;
const toPublic = (row: PublicRecord): PublishedGalleryItem => ({ ...row, year: row.year.year });
type PublicFilter = { categorySlug?: string; year?: number; mediaType?: GalleryMediaType };

async function readPublishedGallery(filter: PublicFilter = {}): Promise<PublishedGalleryItem[]> {
  const rows = await prisma.galleryItem.findMany({
    where: {
      isPublished: true,
      ...(filter.categorySlug ? { category: { is: { slug: filter.categorySlug } } } : {}),
      ...(filter.year ? { year: { is: { year: filter.year } } } : {}),
      ...(filter.mediaType ? { mediaType: filter.mediaType } : {}),
    },
    orderBy: [{ year: { year: "desc" } }, { category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { createdAt: "asc" }],
    take: 1000,
    select: publicSelect,
  });
  return rows.map(toPublic);
}

export function getPublishedGallery(filter: PublicFilter = {}): Promise<PublishedGalleryItem[]> {
  const tags = ["gallery", ...(filter.categorySlug ? [`gallery:category:${filter.categorySlug}`] : []), ...(filter.year ? [`gallery:year:${filter.year}`] : [])];
  return unstable_cache(() => readPublishedGallery(filter), ["published-gallery", filter.categorySlug ?? "all", String(filter.year ?? "all"), filter.mediaType ?? "all"], { tags, revalidate: 3600 })();
}

async function readGalleryLandingData(filter: PublicFilter = {}): Promise<GalleryLandingData> {
  const categoryWhere = {
    isPublished: true,
    ...(filter.year ? { year: { year: filter.year } } : {}),
    ...(filter.mediaType ? { mediaType: filter.mediaType } : {}),
  } satisfies Prisma.GalleryItemWhereInput;
  const yearWhere = {
    isPublished: true,
    ...(filter.categorySlug ? { category: { slug: filter.categorySlug } } : {}),
    ...(filter.mediaType ? { mediaType: filter.mediaType } : {}),
  } satisfies Prisma.GalleryItemWhereInput;
  const [items, categories, years, allForCounts] = await Promise.all([
    readPublishedGallery(filter),
    prisma.galleryCategory.findMany({
      where: { items: { some: categoryWhere } }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, items: { where: categoryWhere, orderBy: [{ isCategoryCover: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }], take: 1, select: { id: true, title: true, mediaType: true, url: true, publicId: true, width: true, height: true, alt: true } } },
    }),
    prisma.galleryYear.findMany({ where: { items: { some: yearWhere } }, orderBy: { year: "desc" }, select: { id: true, year: true, _count: { select: { items: { where: yearWhere } } } } }),
    prisma.galleryItem.findMany({ where: { isPublished: true, ...(filter.mediaType ? { mediaType: filter.mediaType } : {}) }, select: { category: { select: { slug: true } }, year: { select: { year: true } } } }),
  ]);
  const categoryCounts: Record<string, number> = {};
  const yearCounts: Record<string, number> = {};
  for (const row of allForCounts) {
    if (!filter.categorySlug || row.category.slug !== filter.categorySlug) categoryCounts[row.category.slug] = (categoryCounts[row.category.slug] ?? 0) + 1;
    if (!filter.year || row.year.year !== filter.year) yearCounts[String(row.year.year)] = (yearCounts[String(row.year.year)] ?? 0) + 1;
  }
  return { items, categories: categories.flatMap(({ items: covers, ...category }) => covers[0] ? [{ ...category, count: categoryCounts[category.slug] ?? 0, cover: covers[0] }] : []), years: years.map((row) => ({ id: row.id, year: row.year, count: row._count.items })), counts: { categories: categoryCounts, years: yearCounts } };
}

export function getGalleryLandingData(filter: PublicFilter = {}): Promise<GalleryLandingData> {
  const tags = ["gallery", ...(filter.categorySlug ? [`gallery:category:${filter.categorySlug}`] : []), ...(filter.year ? [`gallery:year:${filter.year}`] : [])];
  return unstable_cache(() => readGalleryLandingData(filter), ["gallery-landing", filter.categorySlug ?? "all", String(filter.year ?? "all"), filter.mediaType ?? "all"], { tags, revalidate: 3600 })();
}

export function getFeaturedGallery(limit = 6): Promise<PublishedGalleryItem[]> {
  const safeLimit = Math.min(12, Math.max(1, Math.floor(limit)));
  return unstable_cache(async () => (await prisma.galleryItem.findMany({ where: { isPublished: true, isFeatured: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], take: safeLimit, select: publicSelect })).map(toPublic), ["featured-gallery", String(safeLimit)], { tags: ["gallery"], revalidate: 3600 })();
}
