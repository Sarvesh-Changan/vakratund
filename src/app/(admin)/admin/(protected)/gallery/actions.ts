"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requirePermission } from "@/lib/auth/session";
import { bulkAddGalleryItemsSchema, createGalleryItemSchema, deleteGalleryItemSchema, reorderGalleryItemsSchema, updateGalleryItemSchema } from "@/lib/validation/gallery";
import { bulkAddGalleryItems, createGalleryItem, deleteGalleryItem, GalleryItemNotFoundError, GalleryMediaNotFoundError, listGalleryItems, reorderGalleryItems, updateGalleryItem } from "@/server/services/gallery";

export type GalleryActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };

function validationError(error: { flatten: () => { fieldErrors: Record<string, string[]> } }): GalleryActionResult<never> {
  return { ok: false, error: { code: "VALIDATION_ERROR", message: "Please correct the highlighted fields.", fieldErrors: error.flatten().fieldErrors } };
}

function failure(error: unknown): GalleryActionResult<never> {
  if (error instanceof GalleryMediaNotFoundError) return { ok: false, error: { code: "MEDIA_NOT_FOUND", message: error.message, fieldErrors: { mediaId: [error.message], mediaIds: [error.message] } } };
  if (error instanceof GalleryItemNotFoundError) return { ok: false, error: { code: "NOT_FOUND", message: "The gallery item no longer exists." } };
  return { ok: false, error: { code: "MUTATION_FAILED", message: "The gallery could not be saved. Please try again." } };
}

function revalidateGallery(): void {
  revalidateTag("gallery", "max");
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}

export async function createGallery(input: unknown): Promise<GalleryActionResult<Awaited<ReturnType<typeof createGalleryItem>>>> {
  const session = await requirePermission("media:write");
  const parsed = createGalleryItemSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await createGalleryItem(parsed.data, session.user.id); revalidateGallery(); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function updateGallery(input: unknown): Promise<GalleryActionResult<Awaited<ReturnType<typeof updateGalleryItem>>>> {
  const session = await requirePermission("media:write");
  const parsed = updateGalleryItemSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await updateGalleryItem(parsed.data, session.user.id); revalidateGallery(); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function deleteGallery(input: unknown): Promise<GalleryActionResult<Awaited<ReturnType<typeof deleteGalleryItem>>>> {
  const session = await requirePermission("media:write");
  const parsed = deleteGalleryItemSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await deleteGalleryItem(parsed.data.id, session.user.id); revalidateGallery(); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function reorderGallery(input: unknown): Promise<GalleryActionResult<Awaited<ReturnType<typeof reorderGalleryItems>>>> {
  const session = await requirePermission("media:write");
  const parsed = reorderGalleryItemsSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await reorderGalleryItems(parsed.data, session.user.id); revalidateGallery(); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function bulkAddGallery(input: unknown): Promise<GalleryActionResult<Awaited<ReturnType<typeof bulkAddGalleryItems>>>> {
  const session = await requirePermission("media:write");
  const parsed = bulkAddGalleryItemsSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await bulkAddGalleryItems(parsed.data, session.user.id); revalidateGallery(); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function refreshGallery(): Promise<GalleryActionResult<Awaited<ReturnType<typeof listGalleryItems>>>> {
  await requirePermission("media:write");
  return { ok: true, data: await listGalleryItems() };
}

