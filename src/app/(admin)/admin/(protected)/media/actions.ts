"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { createSaveMediaAssetSchema, deleteMediaAssetSchema, updateMediaAssetSchema } from "@/lib/validation/media";
import { createMediaAsset, deleteMediaAsset, findUnusedImageAssets, MediaAssetInUseError, updateMediaAsset } from "@/server/services/media";
import { listMediaAssets } from "@/server/services/media";

const unusedDeleteSchema = z.object({ ids: z.array(z.string().cuid()).min(1).max(200) }).strict();

export async function findUnusedMediaAssetsAction() {
  await requirePermission("media:write");
  const assets = await listMediaAssets();
  return findUnusedImageAssets(assets);
}

export async function deleteUnusedMediaAssetsAction(input: unknown) {
  const session = await requirePermission("media:write");
  const parsed = unusedDeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "Select one or more unused images." };
  const deleted: string[] = [];
  const blocked: string[] = [];
  for (const id of parsed.data.ids) {
    try {
      await deleteMediaAsset(id, session.user.id);
      deleted.push(id);
    } catch (error) {
      if (error instanceof MediaAssetInUseError) blocked.push(id);
    }
  }
  revalidatePath("/admin/media");
  return { ok: true as const, deleted, blocked };
}

export type MediaActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };

function validationError(error: { flatten: () => { fieldErrors: Record<string, string[]> } }): MediaActionResult<never> {
  return { ok: false, error: { code: "VALIDATION_ERROR", message: "Please correct the highlighted fields.", fieldErrors: error.flatten().fieldErrors } };
}

export async function saveMediaAsset(input: unknown): Promise<MediaActionResult<Awaited<ReturnType<typeof createMediaAsset>>>> {
  const requestedSection = input && typeof input === "object" && "section" in input ? input.section : null;
  const session = await requirePermission(requestedSection === "services" || requestedSection === "pages" ? "content:write" : "media:write");
  const parsed = createSaveMediaAssetSchema(env.CLOUDINARY_CLOUD_NAME?.trim() ?? "").safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const asset = await createMediaAsset(parsed.data, session.user.id);
    revalidatePath("/admin/media");
    return { ok: true, data: asset };
  } catch {
    return { ok: false, error: { code: "SAVE_FAILED", message: "The media asset could not be saved." } };
  }
}

export async function updateMediaMetadata(input: unknown): Promise<MediaActionResult<Awaited<ReturnType<typeof updateMediaAsset>>>> {
  const session = await requirePermission("media:write");
  const parsed = updateMediaAssetSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const asset = await updateMediaAsset(parsed.data, session.user.id);
    revalidatePath("/admin/media");
    return { ok: true, data: asset };
  } catch {
    return { ok: false, error: { code: "UPDATE_FAILED", message: "The media metadata could not be updated." } };
  }
}

export async function removeMediaAsset(input: unknown): Promise<MediaActionResult<{ deleted: true } | { blocked: true; usages: { type: string; label: string; href?: string }[] }>> {
  const session = await requirePermission("media:write");
  const parsed = deleteMediaAssetSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const result = await deleteMediaAsset(parsed.data.id, session.user.id);
    revalidatePath("/admin/media");
    return { ok: true, data: result };
  } catch (error) {
    if (error instanceof MediaAssetInUseError) return { ok: true, data: { blocked: true, usages: error.usages } };
    return { ok: false, error: { code: "DELETE_FAILED", message: "The media asset could not be deleted." } };
  }
}
