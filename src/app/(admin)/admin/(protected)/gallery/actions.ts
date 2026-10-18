"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requirePermission } from "@/lib/auth/session";
import { checkGallerySyncLimit } from "@/lib/rate-limit/gallery-sync";
import { createGalleryCategorySchema, createGalleryItemSchema, createGalleryYearSchema, deleteGalleryCategorySchema, deleteGalleryItemSchema, deleteGalleryYearSchema, galleryDuplicateSchema, moveGalleryYearItemsSchema, reorderGalleryCategorySchema, reorderGalleryItemSchema, syncGalleryMetadataSchema, toggleGalleryItemSchema, updateGalleryCategorySchema, updateGalleryItemSchema } from "@/lib/validation/gallery";
import { createGalleryCategory as createCategoryRecord, createGalleryItem as createItemRecord, createGalleryYear as createYearRecord, deleteGalleryCategory as deleteCategoryRecord, deleteGalleryItem as deleteItemRecord, deleteGalleryYear as deleteYearRecord, findGalleryDuplicate, GalleryAssetInvalidError, GalleryAssetNotFoundError, GalleryCategoryNameConflictError, GalleryCategoryNotFoundError, GalleryCategorySlugConflictError, GalleryDuplicateEtagError, GalleryItemNotFoundError, GalleryYearConflictError, GalleryYearHasItemsError, GalleryYearNotFoundError, listGalleryCategories, listGalleryItems, listGalleryYears, moveGalleryYearItems as moveYearItemsRecord, reorderGalleryCategory as reorderCategoryRecord, reorderGalleryItem as reorderItemRecord, syncMissingGalleryMetadata, toggleGalleryItem as toggleItemRecord, updateGalleryCategory as updateCategoryRecord, updateGalleryItem as updateItemRecord } from "@/server/services/gallery";

export type GalleryActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]>; duplicate?: { id: string; title: string; categoryName: string }; cleanupFailures?: number; retryAfterSeconds?: number } };

function validationError(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }): GalleryActionResult<never> {
  const fieldErrors = Object.fromEntries(Object.entries(error.flatten().fieldErrors).filter((entry): entry is [string, string[]] => Array.isArray(entry[1])));
  return { ok: false, error: { code: "VALIDATION_ERROR", message: "Please correct the highlighted fields.", fieldErrors } };
}

function failure(error: unknown): GalleryActionResult<never> {
  if (error instanceof GalleryCategoryNameConflictError) return { ok: false, error: { code: "CATEGORY_NAME_EXISTS", message: error.message, fieldErrors: { name: [error.message] } } };
  if (error instanceof GalleryCategorySlugConflictError) return { ok: false, error: { code: "CATEGORY_SLUG_EXISTS", message: error.message, fieldErrors: { slug: [error.message] } } };
  if (error instanceof GalleryCategoryNotFoundError) return { ok: false, error: { code: "CATEGORY_NOT_FOUND", message: "The gallery category no longer exists." } };
  if (error instanceof GalleryItemNotFoundError) return { ok: false, error: { code: "ITEM_NOT_FOUND", message: "The gallery item no longer exists." } };
  if (error instanceof GalleryYearNotFoundError) return { ok: false, error: { code: "YEAR_NOT_FOUND", message: "The gallery year no longer exists." } };
  if (error instanceof GalleryYearConflictError) return { ok: false, error: { code: "YEAR_EXISTS", message: error.message, fieldErrors: { year: [error.message] } } };
  if (error instanceof GalleryYearHasItemsError) return { ok: false, error: { code: "YEAR_HAS_ITEMS", message: error.message, fieldErrors: { year: [String(error.count)] } } };
  if (error instanceof GalleryAssetNotFoundError || error instanceof GalleryAssetInvalidError) return { ok: false, error: { code: "ASSET_INVALID", message: error.message, fieldErrors: { assetId: [error.message] } } };
  if (error instanceof GalleryDuplicateEtagError) return { ok: false, error: { code: "DUPLICATE_ETAG", message: error.message, duplicate: error.duplicate } };
  console.error("Gallery mutation failed", { error: error instanceof Error ? error.message : "unknown error" });
  return { ok: false, error: { code: "MUTATION_FAILED", message: "The gallery could not be saved. Please try again." } };
}

function revalidateGallery(slugs: readonly (string | null | undefined)[] = [], years: readonly (number | null | undefined)[] = []): void {
  revalidateTag("gallery", "max");
  for (const slug of new Set(slugs.filter((value): value is string => Boolean(value)))) revalidateTag(`gallery:category:${slug}`, "max");
  for (const year of new Set(years.filter((value): value is number => typeof value === "number"))) revalidateTag(`gallery:year:${year}`, "max");
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
}

export async function createGalleryYear(input: unknown): Promise<GalleryActionResult<Awaited<ReturnType<typeof createYearRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = createGalleryYearSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await createYearRecord(parsed.data, session.user.id); revalidateGallery(); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function moveGalleryYearItems(input: unknown): Promise<GalleryActionResult<Awaited<ReturnType<typeof moveYearItemsRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = moveGalleryYearItemsSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await moveYearItemsRecord(parsed.data.fromYearId, parsed.data.toYearId, session.user.id); revalidateGallery(); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function deleteGalleryYear(input: unknown): Promise<GalleryActionResult<Awaited<ReturnType<typeof deleteYearRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = deleteGalleryYearSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await deleteYearRecord(parsed.data.id, session.user.id); revalidateGallery(); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function createGalleryCategory(input: unknown): Promise<GalleryActionResult<Awaited<ReturnType<typeof createCategoryRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = createGalleryCategorySchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await createCategoryRecord(parsed.data, session.user.id); revalidateGallery([result.slug]); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function updateGalleryCategory(input: unknown): Promise<GalleryActionResult<Awaited<ReturnType<typeof updateCategoryRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = updateGalleryCategorySchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const previous = await listGalleryCategories().then((rows) => rows.find((row) => row.id === parsed.data.id)?.slug);
    const result = await updateCategoryRecord(parsed.data, session.user.id);
    revalidateGallery([previous, result.slug]);
    return { ok: true, data: result };
  } catch (error) { return failure(error); }
}

export async function deleteGalleryCategory(input: unknown): Promise<GalleryActionResult<Awaited<ReturnType<typeof deleteCategoryRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = deleteGalleryCategorySchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const previous = await listGalleryCategories().then((rows) => rows.find((row) => row.id === parsed.data.id)?.slug);
    const result = await deleteCategoryRecord(parsed.data.id, session.user.id);
    revalidateGallery([previous]);
    return { ok: true, data: result };
  } catch (error) { return failure(error); }
}

export async function reorderGalleryCategory(input: unknown): Promise<GalleryActionResult<Awaited<ReturnType<typeof reorderCategoryRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = reorderGalleryCategorySchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await reorderCategoryRecord(parsed.data, session.user.id); revalidateGallery(result.map((row) => row.slug)); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function createGalleryItem(input: unknown): Promise<GalleryActionResult<Awaited<ReturnType<typeof createItemRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = createGalleryItemSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await createItemRecord(parsed.data, session.user.id); revalidateGallery([result.category.slug], [result.year]); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function updateGalleryItem(input: unknown): Promise<GalleryActionResult<Awaited<ReturnType<typeof updateItemRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = updateGalleryItemSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await updateItemRecord(parsed.data, session.user.id); revalidateGallery([result.category.slug], [result.year]); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function deleteGalleryItem(input: unknown): Promise<GalleryActionResult<Awaited<ReturnType<typeof deleteItemRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = deleteGalleryItemSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await deleteItemRecord(parsed.data.id, session.user.id); revalidateGallery([result.categorySlug], [result.year]); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function toggleGalleryItem(input: unknown): Promise<GalleryActionResult<Awaited<ReturnType<typeof toggleItemRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = toggleGalleryItemSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await toggleItemRecord(parsed.data, session.user.id); revalidateGallery([result.category.slug], [result.year]); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function reorderGalleryItem(input: unknown): Promise<GalleryActionResult<Awaited<ReturnType<typeof reorderItemRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = reorderGalleryItemSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await reorderItemRecord(parsed.data, session.user.id); revalidateGallery(result.map((row) => row.category.slug), result.map((row) => row.year)); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function checkGalleryDuplicate(input: unknown): Promise<GalleryActionResult<Awaited<ReturnType<typeof findGalleryDuplicate>>>> {
  await requirePermission("content:write");
  const parsed = galleryDuplicateSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { return { ok: true, data: await findGalleryDuplicate(parsed.data.etag, parsed.data.excludeId) }; } catch (error) { return failure(error); }
}

export async function syncGalleryMetadata(input: unknown = {}): Promise<GalleryActionResult<Awaited<ReturnType<typeof syncMissingGalleryMetadata>>>> {
  const session = await requirePermission("content:write");
  const parsed = syncGalleryMetadataSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const rate = checkGallerySyncLimit(session.user.id);
  if (!rate.allowed) return { ok: false, error: { code: "RATE_LIMITED", message: "Metadata sync is limited to three runs per hour.", retryAfterSeconds: rate.retryAfterSeconds } };
  try { const result = await syncMissingGalleryMetadata(session.user.id); revalidateGallery(); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function refreshGalleryLists(): Promise<GalleryActionResult<{ categories: Awaited<ReturnType<typeof listGalleryCategories>>; years: Awaited<ReturnType<typeof listGalleryYears>>; items: Awaited<ReturnType<typeof listGalleryItems>> }>> {
  await requirePermission("content:write");
  try { const [categories, years, items] = await Promise.all([listGalleryCategories(), listGalleryYears(), listGalleryItems()]); return { ok: true, data: { categories, years, items } }; } catch (error) { return failure(error); }
}
