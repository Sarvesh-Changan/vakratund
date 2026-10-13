import "server-only";

import type { GalleryDesignType, GalleryMediaType, MediaKind, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";
import { getCloudinaryResourceMetadata } from "@/lib/cloudinary/admin";
import { destroyCloudinaryAsset } from "@/lib/cloudinary/signature";
import { slugify } from "@/lib/utils";
import type { CreateGalleryCategoryInput, CreateGalleryItemInput, GalleryFilterInput, ReorderGalleryItemInput, ToggleGalleryItemInput, UpdateGalleryCategoryInput, UpdateGalleryItemInput } from "@/lib/validation/gallery";
import { logActivity } from "@/server/services/activity";
import { getMediaUsages } from "@/server/services/media";

export type GalleryCategoryView = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  imageCount: number;
};

export type GalleryItemView = {
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
  etag: string;
  width: number | null;
  height: number | null;
  duration: number | null;
  isCategoryCover: boolean;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type GalleryItemRecord = Prisma.GalleryItemGetPayload<{ select: typeof galleryItemSelect }>;

export class GalleryCategoryNotFoundError extends Error {
  constructor() { super("Gallery category not found."); this.name = "GalleryCategoryNotFoundError"; }
}
export class GalleryItemNotFoundError extends Error {
  constructor() { super("Gallery item not found."); this.name = "GalleryItemNotFoundError"; }
}
export class GalleryCategoryNameConflictError extends Error {
  constructor() { super("A category with this name already exists."); this.name = "GalleryCategoryNameConflictError"; }
}
export class GalleryCategorySlugConflictError extends Error {
  constructor() { super("A category with this slug already exists."); this.name = "GalleryCategorySlugConflictError"; }
}
export class GalleryDuplicateEtagError extends Error {
  readonly duplicate: { id: string; title: string; categoryName: string };
  constructor(duplicate: { id: string; title: string; categoryName: string }) {
    super(`This upload matches “${duplicate.title}” in ${duplicate.categoryName}.`);
    this.name = "GalleryDuplicateEtagError";
    this.duplicate = duplicate;
  }
}
export class GalleryAssetNotFoundError extends Error {
  constructor() { super("The selected gallery upload could not be found."); this.name = "GalleryAssetNotFoundError"; }
}
export class GalleryAssetInvalidError extends Error {
  constructor() { super("Choose an image or video uploaded to the Gallery section."); this.name = "GalleryAssetInvalidError"; }
}

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { items: true } },
} satisfies Prisma.GalleryCategorySelect;

const galleryItemSelect = {
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
  etag: true,
  width: true,
  height: true,
  duration: true,
  isCategoryCover: true,
  isFeatured: true,
  isPublished: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.GalleryItemSelect;

function toCategoryView(record: Prisma.GalleryCategoryGetPayload<{ select: typeof categorySelect }>): GalleryCategoryView {
  return { id: record.id, name: record.name, slug: record.slug, sortOrder: record.sortOrder, createdAt: record.createdAt.toISOString(), updatedAt: record.updatedAt.toISOString(), imageCount: record._count.items };
}

function toGalleryView(record: GalleryItemRecord): GalleryItemView {
  return { ...record, createdAt: record.createdAt.toISOString(), updatedAt: record.updatedAt.toISOString() };
}

async function assertCategoryNameAvailable(tx: Prisma.TransactionClient, name: string, excludeId?: string): Promise<void> {
  const existing = await tx.galleryCategory.findFirst({
    where: { name: { equals: name.trim(), mode: "insensitive" }, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true },
  });
  if (existing) throw new GalleryCategoryNameConflictError();
}

async function assertCategorySlugAvailable(tx: Prisma.TransactionClient, slug: string, excludeId?: string): Promise<void> {
  const existing = await tx.galleryCategory.findFirst({ where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } });
  if (existing) throw new GalleryCategorySlugConflictError();
}

function categorySlug(name: string, supplied?: string): string {
  return slugify(supplied?.trim() || name);
}

async function setCoverInTransaction(tx: Prisma.TransactionClient, categoryId: string, itemId: string | null): Promise<void> {
  if (itemId) await tx.galleryItem.updateMany({ where: { categoryId, isCategoryCover: true, id: { not: itemId } }, data: { isCategoryCover: false } });
}

export async function listGalleryCategories(): Promise<GalleryCategoryView[]> {
  const rows = await prisma.galleryCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: categorySelect });
  return rows.map(toCategoryView);
}

export async function getGalleryCategory(id: string): Promise<GalleryCategoryView | null> {
  const record = await prisma.galleryCategory.findUnique({ where: { id }, select: categorySelect });
  return record ? toCategoryView(record) : null;
}

export async function listGalleryItems(filters: GalleryFilterInput = {}): Promise<GalleryItemView[]> {
  const records = await prisma.galleryItem.findMany({
    where: {
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.designType ? { designType: filters.designType } : {}),
      ...(filters.mediaType ? { mediaType: filters.mediaType } : {}),
      ...(filters.isPublished && filters.isPublished !== "all" ? { isPublished: filters.isPublished === "true" } : {}),
    },
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    take: 500,
    select: galleryItemSelect,
  });
  return records.map(toGalleryView);
}

export async function findGalleryDuplicate(etag: string, excludeId?: string): Promise<{ id: string; title: string; categoryName: string } | null> {
  const found = await prisma.galleryItem.findFirst({ where: { etag, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true, title: true, category: { select: { name: true } } } });
  return found ? { id: found.id, title: found.title, categoryName: found.category.name } : null;
}

export async function createGalleryCategory(input: CreateGalleryCategoryInput, userId: string): Promise<GalleryCategoryView> {
  const slug = categorySlug(input.name, input.slug);
  if (!slug) throw new GalleryCategorySlugConflictError();
  const record = await prisma.$transaction(async (tx) => {
    await assertCategoryNameAvailable(tx, input.name);
    await assertCategorySlugAvailable(tx, slug);
    return tx.galleryCategory.create({ data: { name: input.name, slug, sortOrder: input.sortOrder }, select: categorySelect });
  }, { isolationLevel: "Serializable" });
  await logActivity({ userId, action: "gallery.category.create", entityType: "GalleryCategory", entityId: record.id, summary: `Created gallery category ${record.name}`, diff: { slug: record.slug, sortOrder: record.sortOrder } });
  return toCategoryView(record);
}

export async function updateGalleryCategory(input: UpdateGalleryCategoryInput, userId: string): Promise<GalleryCategoryView> {
  const slug = categorySlug(input.name, input.slug);
  if (!slug) throw new GalleryCategorySlugConflictError();
  const record = await prisma.$transaction(async (tx) => {
    const current = await tx.galleryCategory.findUnique({ where: { id: input.id }, select: { id: true } });
    if (!current) throw new GalleryCategoryNotFoundError();
    await assertCategoryNameAvailable(tx, input.name, input.id);
    await assertCategorySlugAvailable(tx, slug, input.id);
    return tx.galleryCategory.update({ where: { id: input.id }, data: { name: input.name, slug, sortOrder: input.sortOrder }, select: categorySelect });
  }, { isolationLevel: "Serializable" });
  await logActivity({ userId, action: "gallery.category.update", entityType: "GalleryCategory", entityId: record.id, summary: `Updated gallery category ${record.name}`, diff: { slug: record.slug, sortOrder: record.sortOrder } });
  return toCategoryView(record);
}

async function cleanupCloudinaryAssets(resources: readonly { publicId: string; mediaType: GalleryMediaType }[]): Promise<number> {
  let failures = 0;
  for (const resource of resources) {
    try {
      const mediaAsset = await prisma.mediaAsset.findUnique({ where: { publicId: resource.publicId }, select: { id: true } });
      if (mediaAsset && (await getMediaUsages(mediaAsset.id)).length > 0) continue;
      await destroyCloudinaryAsset(resource.publicId, resource.mediaType as MediaKind);
      if (mediaAsset) await prisma.mediaAsset.delete({ where: { id: mediaAsset.id } });
    } catch (error) {
      failures += 1;
      console.error("Gallery Cloudinary cleanup failed", { publicId: resource.publicId, error: error instanceof Error ? error.message : "unknown error" });
    }
  }
  return failures;
}

export async function deleteGalleryCategory(id: string, userId: string): Promise<{ deleted: true; deletedItems: number; cleanupFailures: number }> {
  const result = await prisma.$transaction(async (tx) => {
    const category = await tx.galleryCategory.findUnique({ where: { id }, select: { id: true, name: true, slug: true, items: { select: { publicId: true, mediaType: true } } } });
    if (!category) throw new GalleryCategoryNotFoundError();
    await tx.galleryCategory.delete({ where: { id } });
    return { category, resources: category.items };
  });
  await logActivity({ userId, action: "gallery.category.delete", entityType: "GalleryCategory", entityId: id, summary: `Deleted gallery category ${result.category.name}`, diff: { deletedItems: result.resources.length } });
  const cleanupFailures = await cleanupCloudinaryAssets(result.resources);
  return { deleted: true, deletedItems: result.resources.length, cleanupFailures };
}

export async function reorderGalleryCategory(input: ReorderGalleryItemInput, userId: string): Promise<GalleryCategoryView[]> {
  const rows = await prisma.galleryCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, sortOrder: true } });
  const index = rows.findIndex((row) => row.id === input.id);
  const current = rows[index];
  const neighbor = rows[index + (input.direction === "up" ? -1 : 1)];
  if (!current) throw new GalleryCategoryNotFoundError();
  if (!neighbor) return listGalleryCategories();
  await prisma.$transaction([
    prisma.galleryCategory.update({ where: { id: current.id }, data: { sortOrder: neighbor.sortOrder } }),
    prisma.galleryCategory.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder } }),
  ]);
  await logActivity({ userId, action: "gallery.category.reorder", entityType: "GalleryCategory", entityId: current.id, summary: `Moved gallery category ${input.direction}`, diff: { direction: input.direction } });
  return listGalleryCategories();
}

async function resolveGalleryAsset(tx: Prisma.TransactionClient, assetId: string): Promise<{ publicId: string; url: string; format: string; bytes: number; etag: string; width: number | null; height: number | null; mediaType: GalleryMediaType }> {
  const asset = await tx.mediaAsset.findUnique({ where: { id: assetId }, select: { publicId: true, url: true, format: true, bytes: true, etag: true, width: true, height: true, kind: true, folder: true } });
  if (!asset) throw new GalleryAssetNotFoundError();
  if (asset.folder !== "vakratund/gallery" || (asset.kind !== "IMAGE" && asset.kind !== "VIDEO") || !asset.format || asset.bytes === null || !asset.etag) throw new GalleryAssetInvalidError();
  return { publicId: asset.publicId, url: asset.url, format: asset.format, bytes: asset.bytes, etag: asset.etag, width: asset.width, height: asset.height, mediaType: asset.kind };
}

export async function createGalleryItem(input: CreateGalleryItemInput, userId: string): Promise<GalleryItemView> {
  const record = await prisma.$transaction(async (tx) => {
    const asset = await resolveGalleryAsset(tx, input.assetId);
    const category = await tx.galleryCategory.findUnique({ where: { id: input.categoryId }, select: { id: true } });
    if (!category) throw new GalleryCategoryNotFoundError();
    if (!input.keepDuplicate) {
      const duplicate = await tx.galleryItem.findFirst({ where: { etag: asset.etag }, select: { id: true, title: true, category: { select: { name: true } } } });
      if (duplicate) throw new GalleryDuplicateEtagError({ id: duplicate.id, title: duplicate.title, categoryName: duplicate.category.name });
    }
    if (input.isCategoryCover) await setCoverInTransaction(tx, input.categoryId, null);
    return tx.galleryItem.create({
      data: { ...asset, title: input.title, categoryId: input.categoryId, designType: input.designType, duration: input.duration ?? null, isCategoryCover: input.isCategoryCover, isFeatured: input.isFeatured, isPublished: input.isPublished, sortOrder: input.sortOrder },
      select: galleryItemSelect,
    });
  }, { isolationLevel: "Serializable" });
  await logActivity({ userId, action: "gallery.item.create", entityType: "GalleryItem", entityId: record.id, summary: `Added ${record.title} to gallery`, diff: { categoryId: record.categoryId, designType: record.designType, mediaType: record.mediaType, isCategoryCover: record.isCategoryCover, isFeatured: record.isFeatured, isPublished: record.isPublished } });
  return toGalleryView(record);
}

export async function updateGalleryItem(input: UpdateGalleryItemInput, userId: string): Promise<GalleryItemView> {
  const record = await prisma.$transaction(async (tx) => {
    const current = await tx.galleryItem.findUnique({ where: { id: input.id }, select: { id: true } });
    if (!current) throw new GalleryItemNotFoundError();
    const category = await tx.galleryCategory.findUnique({ where: { id: input.categoryId }, select: { id: true } });
    if (!category) throw new GalleryCategoryNotFoundError();
    if (input.isCategoryCover) await setCoverInTransaction(tx, input.categoryId, input.id);
    return tx.galleryItem.update({ where: { id: input.id }, data: { title: input.title, categoryId: input.categoryId, designType: input.designType, isCategoryCover: input.isCategoryCover, isFeatured: input.isFeatured, isPublished: input.isPublished, sortOrder: input.sortOrder }, select: galleryItemSelect });
  }, { isolationLevel: "Serializable" });
  await logActivity({ userId, action: "gallery.item.update", entityType: "GalleryItem", entityId: record.id, summary: `Updated ${record.title}`, diff: { categoryId: record.categoryId, designType: record.designType, isCategoryCover: record.isCategoryCover, isFeatured: record.isFeatured, isPublished: record.isPublished, sortOrder: record.sortOrder } });
  return toGalleryView(record);
}

export async function toggleGalleryItem(input: ToggleGalleryItemInput, userId: string): Promise<GalleryItemView> {
  const record = await prisma.$transaction(async (tx) => {
    const current = await tx.galleryItem.findUnique({ where: { id: input.id }, select: { categoryId: true } });
    if (!current) throw new GalleryItemNotFoundError();
    if (input.flag === "isCategoryCover" && input.value) await setCoverInTransaction(tx, current.categoryId, input.id);
    return tx.galleryItem.update({ where: { id: input.id }, data: { [input.flag]: input.value }, select: galleryItemSelect });
  }, { isolationLevel: "Serializable" });
  await logActivity({ userId, action: `gallery.item.${input.flag}`, entityType: "GalleryItem", entityId: record.id, summary: `${input.flag} ${input.value ? "enabled" : "disabled"} for ${record.title}`, diff: { flag: input.flag, value: input.value, categoryId: record.categoryId } });
  return toGalleryView(record);
}

export async function reorderGalleryItem(input: ReorderGalleryItemInput, userId: string): Promise<GalleryItemView[]> {
  const current = await prisma.galleryItem.findUnique({ where: { id: input.id }, select: { id: true, categoryId: true, sortOrder: true } });
  if (!current) throw new GalleryItemNotFoundError();
  const rows = await prisma.galleryItem.findMany({ where: { categoryId: current.categoryId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, sortOrder: true } });
  const index = rows.findIndex((row) => row.id === input.id);
  const neighbor = rows[index + (input.direction === "up" ? -1 : 1)];
  if (!neighbor) return listGalleryItems({ categoryId: current.categoryId });
  await prisma.$transaction([
    prisma.galleryItem.update({ where: { id: current.id }, data: { sortOrder: neighbor.sortOrder } }),
    prisma.galleryItem.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder } }),
  ]);
  await logActivity({ userId, action: "gallery.item.reorder", entityType: "GalleryItem", entityId: current.id, summary: `Moved gallery item ${input.direction}`, diff: { categoryId: current.categoryId, direction: input.direction } });
  return listGalleryItems({ categoryId: current.categoryId });
}

export async function deleteGalleryItem(id: string, userId: string): Promise<{ deleted: true; categorySlug: string; cleanupFailures: number }> {
  const record = await prisma.$transaction(async (tx) => {
    const current = await tx.galleryItem.findUnique({ where: { id }, select: { id: true, title: true, publicId: true, mediaType: true, category: { select: { slug: true } } } });
    if (!current) throw new GalleryItemNotFoundError();
    await tx.galleryItem.delete({ where: { id } });
    return { ...current, categorySlug: current.category.slug };
  });
  await logActivity({ userId, action: "gallery.item.delete", entityType: "GalleryItem", entityId: id, summary: `Deleted ${record.title}`, diff: { mediaType: record.mediaType } });
  const cleanupFailures = await cleanupCloudinaryAssets([{ publicId: record.publicId, mediaType: record.mediaType }]);
  return { deleted: true, categorySlug: record.categorySlug, cleanupFailures };
}

export async function syncMissingGalleryMetadata(userId: string): Promise<{ checked: number; updated: number; failed: number }> {
  const missing = await prisma.galleryItem.findMany({
    where: { OR: [{ bytes: 0 }, { etag: "" }, { width: null }, { height: null }, { mediaType: "VIDEO", duration: null }] },
    orderBy: { updatedAt: "asc" },
    take: 50,
    select: { id: true, publicId: true, mediaType: true, bytes: true, etag: true, width: true, height: true, duration: true },
  });
  let updated = 0;
  let failed = 0;
  for (let start = 0; start < missing.length; start += 5) {
    const batch = missing.slice(start, start + 5);
    const results = await Promise.all(batch.map(async (item) => {
      try {
        const remote = await getCloudinaryResourceMetadata(item.publicId, item.mediaType);
        const data: Prisma.GalleryItemUpdateInput = {
          ...(item.bytes === 0 && remote.bytes !== undefined ? { bytes: remote.bytes } : {}),
          ...(item.etag === "" && remote.etag ? { etag: remote.etag } : {}),
          ...(item.width === null && remote.width !== undefined ? { width: remote.width } : {}),
          ...(item.height === null && remote.height !== undefined ? { height: remote.height } : {}),
          ...(item.mediaType === "VIDEO" && item.duration === null && remote.duration !== undefined ? { duration: remote.duration } : {}),
        };
        if (Object.keys(data).length > 0) await prisma.galleryItem.update({ where: { id: item.id }, data, select: { id: true } });
        return Object.keys(data).length > 0;
      } catch (error) {
        console.error("Gallery metadata sync failed", { itemId: item.id, error: error instanceof Error ? error.message : "unknown error" });
        throw error;
      }
    }));
    updated += results.filter(Boolean).length;
    failed += batch.length - results.length;
  }
  await logActivity({ userId, action: "gallery.metadata.sync", entityType: "GalleryItem", summary: "Synchronized missing gallery metadata", diff: { checked: missing.length, updated, failed } });
  return { checked: missing.length, updated, failed };
}
