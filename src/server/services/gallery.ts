import "server-only";

import { Prisma, type GalleryMediaType, type MediaKind } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";
import { destroyCloudinaryAsset } from "@/lib/cloudinary/signature";
import { getCloudinaryResourceMetadata } from "@/lib/cloudinary/admin";
import { slugify } from "@/lib/utils";
import type { CreateGalleryCategoryInput, CreateGalleryItemInput, CreateGalleryYearInput, GalleryFilterInput, ReorderGalleryItemInput, ToggleGalleryItemInput, UpdateGalleryCategoryInput, UpdateGalleryItemInput } from "@/lib/validation/gallery";
import { getMediaUsages } from "@/server/services/media";
import { logActivity } from "@/server/services/activity";

export type GalleryYearView = { id: string; year: number; createdAt: string; imageCount: number };
export type GalleryCategoryView = { id: string; name: string; slug: string; sortOrder: number; createdAt: string; updatedAt: string; imageCount: number };
export type GalleryItemView = {
  id: string; title: string; categoryId: string; yearId: string; category: { name: string; slug: string }; year: number;
  mediaType: GalleryMediaType; publicId: string; url: string; format: string; bytes: number; etag: string;
  width: number | null; height: number | null; duration: number | null; caption: string | null; alt: string;
  isCategoryCover: boolean; isFeatured: boolean; isPublished: boolean; sortOrder: number; createdAt: string; updatedAt: string;
};

export class GalleryCategoryNotFoundError extends Error { constructor() { super("Gallery category not found."); this.name = "GalleryCategoryNotFoundError"; } }
export class GalleryItemNotFoundError extends Error { constructor() { super("Gallery item not found."); this.name = "GalleryItemNotFoundError"; } }
export class GalleryYearNotFoundError extends Error { constructor() { super("Gallery year not found."); this.name = "GalleryYearNotFoundError"; } }
export class GalleryCategoryNameConflictError extends Error { constructor() { super("A category with this name already exists."); this.name = "GalleryCategoryNameConflictError"; } }
export class GalleryCategorySlugConflictError extends Error { constructor() { super("A category with this slug already exists."); this.name = "GalleryCategorySlugConflictError"; } }
export class GalleryYearConflictError extends Error { constructor() { super("That gallery year already exists."); this.name = "GalleryYearConflictError"; } }
export class GalleryYearHasItemsError extends Error { readonly count: number; constructor(count: number) { super(`This year still contains ${count} image${count === 1 ? "" : "s"}. Move them to another year before deleting it.`); this.name = "GalleryYearHasItemsError"; this.count = count; } }
export class GalleryDuplicateEtagError extends Error { readonly duplicate: { id: string; title: string; categoryName: string }; constructor(duplicate: { id: string; title: string; categoryName: string }) { super(`This upload matches “${duplicate.title}” in ${duplicate.categoryName}.`); this.name = "GalleryDuplicateEtagError"; this.duplicate = duplicate; } }
export class GalleryAssetNotFoundError extends Error { constructor() { super("The selected gallery upload could not be found."); this.name = "GalleryAssetNotFoundError"; } }
export class GalleryAssetInvalidError extends Error { constructor() { super("Choose an image or video uploaded to the Gallery section."); this.name = "GalleryAssetInvalidError"; } }

const categorySelect = { id: true, name: true, slug: true, sortOrder: true, createdAt: true, updatedAt: true, _count: { select: { items: true } } } satisfies Prisma.GalleryCategorySelect;
const yearSelect = { id: true, year: true, createdAt: true, _count: { select: { items: true } } } satisfies Prisma.GalleryYearSelect;
const itemSelect = { id: true, title: true, categoryId: true, yearId: true, category: { select: { name: true, slug: true } }, year: { select: { year: true } }, mediaType: true, publicId: true, url: true, format: true, bytes: true, etag: true, width: true, height: true, duration: true, caption: true, alt: true, isCategoryCover: true, isFeatured: true, isPublished: true, sortOrder: true, createdAt: true, updatedAt: true } satisfies Prisma.GalleryItemSelect;
type ItemRecord = Prisma.GalleryItemGetPayload<{ select: typeof itemSelect }>;

const toCategory = (row: Prisma.GalleryCategoryGetPayload<{ select: typeof categorySelect }>): GalleryCategoryView => ({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), imageCount: row._count.items });
const toYear = (row: Prisma.GalleryYearGetPayload<{ select: typeof yearSelect }>): GalleryYearView => ({ id: row.id, year: row.year, createdAt: row.createdAt.toISOString(), imageCount: row._count.items });
const toItem = (row: ItemRecord): GalleryItemView => ({ ...row, year: row.year.year, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });

async function assertCategoryNameAvailable(tx: Prisma.TransactionClient, name: string, excludeId?: string): Promise<void> {
  const found = await tx.galleryCategory.findFirst({ where: { name: { equals: name.trim(), mode: "insensitive" }, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } });
  if (found) throw new GalleryCategoryNameConflictError();
}
async function assertCategorySlugAvailable(tx: Prisma.TransactionClient, slug: string, excludeId?: string): Promise<void> {
  const found = await tx.galleryCategory.findFirst({ where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } });
  if (found) throw new GalleryCategorySlugConflictError();
}
function categorySlug(name: string, supplied?: string): string { return slugify(supplied?.trim() || name); }
async function setCover(tx: Prisma.TransactionClient, categoryId: string, itemId: string | null): Promise<void> {
  await tx.galleryItem.updateMany({ where: { categoryId, isCategoryCover: true, ...(itemId ? { id: { not: itemId } } : {}) }, data: { isCategoryCover: false } });
}

export async function listGalleryCategories(): Promise<GalleryCategoryView[]> {
  const rows = await prisma.galleryCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: categorySelect });
  return rows.map(toCategory);
}
export async function listGalleryYears(): Promise<GalleryYearView[]> {
  const rows = await prisma.galleryYear.findMany({ orderBy: { year: "desc" }, select: yearSelect });
  return rows.map(toYear);
}
export async function listGalleryItems(filters: GalleryFilterInput = {}): Promise<GalleryItemView[]> {
  const rows = await prisma.galleryItem.findMany({ where: { ...(filters.categoryId ? { categoryId: filters.categoryId } : {}), ...(filters.yearId ? { yearId: filters.yearId } : {}), ...(filters.mediaType ? { mediaType: filters.mediaType } : {}), ...(filters.isPublished && filters.isPublished !== "all" ? { isPublished: filters.isPublished === "true" } : {}), ...(filters.isFeatured && filters.isFeatured !== "all" ? { isFeatured: filters.isFeatured === "true" } : {}) }, orderBy: [{ year: { year: "desc" } }, { category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { createdAt: "asc" }], take: 1000, select: itemSelect });
  return rows.map(toItem);
}
export async function findGalleryDuplicate(etag: string, excludeId?: string): Promise<{ id: string; title: string; categoryName: string } | null> {
  const row = await prisma.galleryItem.findFirst({ where: { etag, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true, title: true, category: { select: { name: true } } } });
  return row ? { id: row.id, title: row.title, categoryName: row.category.name } : null;
}

export async function createGalleryCategory(input: CreateGalleryCategoryInput, userId: string): Promise<GalleryCategoryView> {
  const slug = categorySlug(input.name, input.slug);
  if (!slug) throw new GalleryCategorySlugConflictError();
  const row = await prisma.$transaction(async (tx) => { await assertCategoryNameAvailable(tx, input.name); await assertCategorySlugAvailable(tx, slug); return tx.galleryCategory.create({ data: { name: input.name, slug, sortOrder: input.sortOrder }, select: categorySelect }); }, { isolationLevel: "Serializable" });
  await logActivity({ userId, action: "gallery.category.create", entityType: "GalleryCategory", entityId: row.id, summary: `Created gallery category ${row.name}`, diff: { slug: row.slug, sortOrder: row.sortOrder } });
  return toCategory(row);
}
export async function updateGalleryCategory(input: UpdateGalleryCategoryInput, userId: string): Promise<GalleryCategoryView> {
  const slug = categorySlug(input.name, input.slug);
  if (!slug) throw new GalleryCategorySlugConflictError();
  const row = await prisma.$transaction(async (tx) => { if (!await tx.galleryCategory.findUnique({ where: { id: input.id }, select: { id: true } })) throw new GalleryCategoryNotFoundError(); await assertCategoryNameAvailable(tx, input.name, input.id); await assertCategorySlugAvailable(tx, slug, input.id); return tx.galleryCategory.update({ where: { id: input.id }, data: { name: input.name, slug, sortOrder: input.sortOrder }, select: categorySelect }); }, { isolationLevel: "Serializable" });
  await logActivity({ userId, action: "gallery.category.update", entityType: "GalleryCategory", entityId: row.id, summary: `Updated gallery category ${row.name}`, diff: { slug: row.slug, sortOrder: row.sortOrder } });
  return toCategory(row);
}
export async function deleteGalleryCategory(id: string, userId: string): Promise<{ deleted: true; deletedItems: number; cleanupFailures: number }> {
  const result = await prisma.$transaction(async (tx) => { const category = await tx.galleryCategory.findUnique({ where: { id }, select: { id: true, name: true, items: { select: { publicId: true, mediaType: true } } } }); if (!category) throw new GalleryCategoryNotFoundError(); await tx.galleryCategory.delete({ where: { id } }); return category; });
  await logActivity({ userId, action: "gallery.category.delete", entityType: "GalleryCategory", entityId: id, summary: `Deleted gallery category ${result.name}`, diff: { deletedItems: result.items.length } });
  return { deleted: true, deletedItems: result.items.length, cleanupFailures: await cleanupCloudinaryAssets(result.items) };
}
export async function reorderGalleryCategory(input: ReorderGalleryItemInput, userId: string): Promise<GalleryCategoryView[]> {
  const rows = await prisma.galleryCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, sortOrder: true } });
  const index = rows.findIndex((row) => row.id === input.id); const current = rows[index]; const neighbor = rows[index + (input.direction === "up" ? -1 : 1)];
  if (!current) throw new GalleryCategoryNotFoundError(); if (!neighbor) return listGalleryCategories();
  await prisma.$transaction([prisma.galleryCategory.update({ where: { id: current.id }, data: { sortOrder: neighbor.sortOrder } }), prisma.galleryCategory.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder } })]);
  await logActivity({ userId, action: "gallery.category.reorder", entityType: "GalleryCategory", entityId: current.id, summary: `Moved gallery category ${input.direction}`, diff: { direction: input.direction } });
  return listGalleryCategories();
}

export async function createGalleryYear(input: CreateGalleryYearInput, userId: string): Promise<GalleryYearView> {
  try {
    const row = await prisma.galleryYear.create({ data: { year: input.year }, select: yearSelect });
    await logActivity({ userId, action: "gallery.year.create", entityType: "GalleryYear", entityId: row.id, summary: `Created gallery year ${row.year}`, diff: { year: row.year } });
    return toYear(row);
  } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new GalleryYearConflictError(); throw error; }
}
export async function moveGalleryYearItems(fromYearId: string, toYearId: string, userId: string): Promise<{ moved: number }> {
  if (fromYearId === toYearId) throw new GalleryYearNotFoundError();
  const result = await prisma.$transaction(async (tx) => { const [from, to] = await Promise.all([tx.galleryYear.findUnique({ where: { id: fromYearId }, select: { id: true, year: true } }), tx.galleryYear.findUnique({ where: { id: toYearId }, select: { id: true, year: true } })]); if (!from || !to) throw new GalleryYearNotFoundError(); const moved = await tx.galleryItem.updateMany({ where: { yearId: fromYearId }, data: { yearId: toYearId } }); return { moved: moved.count, from: from.year, to: to.year }; });
  await logActivity({ userId, action: "gallery.year.move-items", entityType: "GalleryYear", entityId: fromYearId, summary: `Moved gallery items to ${result.to}`, diff: { moved: result.moved, toYear: result.to } });
  return { moved: result.moved };
}
export async function deleteGalleryYear(id: string, userId: string): Promise<{ deleted: true; year: number }> {
  const row = await prisma.galleryYear.findUnique({ where: { id }, select: { id: true, year: true, _count: { select: { items: true } } } });
  if (!row) throw new GalleryYearNotFoundError(); if (row._count.items > 0) throw new GalleryYearHasItemsError(row._count.items);
  await prisma.galleryYear.delete({ where: { id } });
  await logActivity({ userId, action: "gallery.year.delete", entityType: "GalleryYear", entityId: id, summary: `Deleted gallery year ${row.year}`, diff: { year: row.year } });
  return { deleted: true, year: row.year };
}

async function resolveAsset(tx: Prisma.TransactionClient, assetId: string): Promise<{ publicId: string; url: string; format: string; bytes: number; etag: string; width: number | null; height: number | null; mediaType: GalleryMediaType }> {
  const asset = await tx.mediaAsset.findUnique({ where: { id: assetId }, select: { publicId: true, url: true, format: true, bytes: true, etag: true, width: true, height: true, kind: true, folder: true } });
  if (!asset) throw new GalleryAssetNotFoundError();
  if (asset.folder !== "vakratund/gallery" || (asset.kind !== "IMAGE" && asset.kind !== "VIDEO") || !asset.format || asset.bytes === null || !asset.etag) throw new GalleryAssetInvalidError();
  return { publicId: asset.publicId, url: asset.url, format: asset.format, bytes: asset.bytes, etag: asset.etag, width: asset.width, height: asset.height, mediaType: asset.kind };
}
export async function createGalleryItem(input: CreateGalleryItemInput, userId: string): Promise<GalleryItemView> {
  const row = await prisma.$transaction(async (tx) => { const asset = await resolveAsset(tx, input.assetId); if (!await tx.galleryCategory.findUnique({ where: { id: input.categoryId }, select: { id: true } })) throw new GalleryCategoryNotFoundError(); if (!await tx.galleryYear.findUnique({ where: { id: input.yearId }, select: { id: true } })) throw new GalleryYearNotFoundError(); if (!input.keepDuplicate) { const duplicate = await tx.galleryItem.findFirst({ where: { etag: asset.etag }, select: { id: true, title: true, category: { select: { name: true } } } }); if (duplicate) throw new GalleryDuplicateEtagError({ id: duplicate.id, title: duplicate.title, categoryName: duplicate.category.name }); } if (input.isCategoryCover) await setCover(tx, input.categoryId, null); return tx.galleryItem.create({ data: { ...asset, title: input.title, categoryId: input.categoryId, yearId: input.yearId, alt: input.alt || input.title, caption: input.caption || null, duration: input.duration ?? null, isCategoryCover: input.isCategoryCover, isFeatured: input.isFeatured, isPublished: input.isPublished, sortOrder: input.sortOrder }, select: itemSelect }); }, { isolationLevel: "Serializable" });
  await logActivity({ userId, action: "gallery.item.create", entityType: "GalleryItem", entityId: row.id, summary: `Added ${row.title} to gallery`, diff: { categoryId: row.categoryId, yearId: row.yearId, mediaType: row.mediaType, isPublished: row.isPublished } });
  return toItem(row);
}
export async function updateGalleryItem(input: UpdateGalleryItemInput, userId: string): Promise<GalleryItemView> {
  const row = await prisma.$transaction(async (tx) => { const current = await tx.galleryItem.findUnique({ where: { id: input.id }, select: { id: true } }); if (!current) throw new GalleryItemNotFoundError(); if (!await tx.galleryCategory.findUnique({ where: { id: input.categoryId }, select: { id: true } })) throw new GalleryCategoryNotFoundError(); if (!await tx.galleryYear.findUnique({ where: { id: input.yearId }, select: { id: true } })) throw new GalleryYearNotFoundError(); if (input.isCategoryCover) await setCover(tx, input.categoryId, input.id); return tx.galleryItem.update({ where: { id: input.id }, data: { title: input.title, categoryId: input.categoryId, yearId: input.yearId, alt: input.alt || input.title, caption: input.caption || null, isCategoryCover: input.isCategoryCover, isFeatured: input.isFeatured, isPublished: input.isPublished, sortOrder: input.sortOrder }, select: itemSelect }); }, { isolationLevel: "Serializable" });
  await logActivity({ userId, action: "gallery.item.update", entityType: "GalleryItem", entityId: row.id, summary: `Updated ${row.title}`, diff: { categoryId: row.categoryId, yearId: row.yearId, isPublished: row.isPublished } });
  return toItem(row);
}
export async function toggleGalleryItem(input: ToggleGalleryItemInput, userId: string): Promise<GalleryItemView> {
  const row = await prisma.$transaction(async (tx) => { const current = await tx.galleryItem.findUnique({ where: { id: input.id }, select: { categoryId: true } }); if (!current) throw new GalleryItemNotFoundError(); if (input.flag === "isCategoryCover" && input.value) await setCover(tx, current.categoryId, input.id); return tx.galleryItem.update({ where: { id: input.id }, data: { [input.flag]: input.value }, select: itemSelect }); }, { isolationLevel: "Serializable" });
  await logActivity({ userId, action: `gallery.item.${input.flag}`, entityType: "GalleryItem", entityId: row.id, summary: `${input.flag} ${input.value ? "enabled" : "disabled"}`, diff: { flag: input.flag, value: input.value, categoryId: row.categoryId, yearId: row.yearId } });
  return toItem(row);
}
export async function reorderGalleryItem(input: ReorderGalleryItemInput, userId: string): Promise<GalleryItemView[]> {
  const current = await prisma.galleryItem.findUnique({ where: { id: input.id }, select: { id: true, categoryId: true, yearId: true, sortOrder: true } }); if (!current) throw new GalleryItemNotFoundError();
  const rows = await prisma.galleryItem.findMany({ where: { categoryId: current.categoryId, yearId: current.yearId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, sortOrder: true } }); const index = rows.findIndex((row) => row.id === input.id); const neighbor = rows[index + (input.direction === "up" ? -1 : 1)]; if (!neighbor) return listGalleryItems({ categoryId: current.categoryId, yearId: current.yearId });
  await prisma.$transaction([prisma.galleryItem.update({ where: { id: current.id }, data: { sortOrder: neighbor.sortOrder } }), prisma.galleryItem.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder } })]);
  await logActivity({ userId, action: "gallery.item.reorder", entityType: "GalleryItem", entityId: current.id, summary: `Moved gallery item ${input.direction}`, diff: { categoryId: current.categoryId, yearId: current.yearId, direction: input.direction } });
  return listGalleryItems({ categoryId: current.categoryId, yearId: current.yearId });
}
export async function deleteGalleryItem(id: string, userId: string): Promise<{ deleted: true; categorySlug: string; year: number; cleanupFailures: number }> {
  const row = await prisma.$transaction(async (tx) => { const item = await tx.galleryItem.findUnique({ where: { id }, select: { id: true, title: true, publicId: true, mediaType: true, category: { select: { slug: true } }, year: { select: { year: true } } } }); if (!item) throw new GalleryItemNotFoundError(); await tx.galleryItem.delete({ where: { id } }); return item; });
  await logActivity({ userId, action: "gallery.item.delete", entityType: "GalleryItem", entityId: id, summary: `Deleted ${row.title}`, diff: { mediaType: row.mediaType, year: row.year.year } });
  return { deleted: true, categorySlug: row.category.slug, year: row.year.year, cleanupFailures: await cleanupCloudinaryAssets([{ publicId: row.publicId, mediaType: row.mediaType }]) };
}

async function cleanupCloudinaryAssets(resources: readonly { publicId: string; mediaType: GalleryMediaType }[]): Promise<number> {
  let failures = 0;
  for (const resource of resources) { try { const media = await prisma.mediaAsset.findUnique({ where: { publicId: resource.publicId }, select: { id: true } }); if (media && (await getMediaUsages(media.id)).length > 0) continue; await destroyCloudinaryAsset(resource.publicId, resource.mediaType as MediaKind); if (media) await prisma.mediaAsset.delete({ where: { id: media.id } }); } catch (error) { failures += 1; console.error("Gallery Cloudinary cleanup failed", { publicId: resource.publicId, error: error instanceof Error ? error.message : "unknown error" }); } }
  return failures;
}

export async function syncMissingGalleryMetadata(userId: string): Promise<{ checked: number; updated: number; failed: number }> {
  const rows = await prisma.galleryItem.findMany({ where: { OR: [{ bytes: 0 }, { etag: "" }, { width: null }, { height: null }, { mediaType: "VIDEO", duration: null }] }, orderBy: { updatedAt: "asc" }, take: 50, select: { id: true, publicId: true, mediaType: true, bytes: true, etag: true, width: true, height: true, duration: true } });
  let updated = 0; let failed = 0;
  for (const item of rows) { try { const remote = await getCloudinaryResourceMetadata(item.publicId, item.mediaType); const data: Prisma.GalleryItemUpdateInput = { ...(item.bytes === 0 && remote.bytes !== undefined ? { bytes: remote.bytes } : {}), ...(item.etag === "" && remote.etag ? { etag: remote.etag } : {}), ...(item.width === null && remote.width !== undefined ? { width: remote.width } : {}), ...(item.height === null && remote.height !== undefined ? { height: remote.height } : {}), ...(item.mediaType === "VIDEO" && item.duration === null && remote.duration !== undefined ? { duration: remote.duration } : {}) }; if (Object.keys(data).length > 0) { await prisma.galleryItem.update({ where: { id: item.id }, data, select: { id: true } }); updated += 1; } } catch { failed += 1; } }
  await logActivity({ userId, action: "gallery.metadata.sync", entityType: "GalleryItem", summary: "Synchronized gallery metadata", diff: { checked: rows.length, updated, failed } });
  return { checked: rows.length, updated, failed };
}
