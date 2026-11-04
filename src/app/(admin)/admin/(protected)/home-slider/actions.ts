"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import {
  createHomeSlideSchema,
  updateHomeSlideSchema,
  deleteHomeSlideSchema,
  toggleHomeSlideActiveSchema,
  reorderHomeSlideSchema,
  setHomeSlideOrderSchema,
  updateHomeShowcaseSettingsSchema,
} from "@/lib/validation/home-slides";
import {
  createHomeSlide,
  updateHomeSlide,
  deleteHomeSlide,
  toggleHomeSlideActive,
  reorderHomeSlide,
  setHomeSlideOrder,
  updateHomeShowcaseSettings,
  HomeSlideAssetInvalidError,
  HomeSlideNotFoundError,
} from "@/server/services/home-slides";

export type HomeSlideActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };

function validationError(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }): HomeSlideActionResult<never> {
  const fieldErrors = Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter((entry): entry is [string, string[]] => Array.isArray(entry[1])),
  );
  return { ok: false, error: { code: "VALIDATION_ERROR", message: "Please correct the highlighted fields.", fieldErrors } };
}

function failure(error: unknown): HomeSlideActionResult<never> {
  if (error instanceof HomeSlideNotFoundError) {
    return { ok: false, error: { code: "NOT_FOUND", message: error.message } };
  }
  if (error instanceof HomeSlideAssetInvalidError) {
    return { ok: false, error: { code: "ASSET_INVALID", message: error.message, fieldErrors: { mediaId: [error.message] } } };
  }
  console.error("Home slide mutation failed", { error: error instanceof Error ? error.message : "unknown error" });
  return { ok: false, error: { code: "MUTATION_FAILED", message: "The slide could not be saved. Please try again." } };
}

function revalidateSlides() {
  revalidateTag("homeSlider", "max");
  revalidatePath("/");
  revalidatePath("/admin/home-slider");
}

export async function createHomeSlideAction(input: unknown): Promise<HomeSlideActionResult<Awaited<ReturnType<typeof createHomeSlide>>>> {
  const session = await requirePermission("content:write");
  const parsed = createHomeSlideSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const result = await createHomeSlide(parsed.data, session.user.id);
    revalidateSlides();
    return { ok: true, data: result };
  } catch (error) {
    return failure(error);
  }
}

export async function updateHomeSlideAction(input: unknown): Promise<HomeSlideActionResult<Awaited<ReturnType<typeof updateHomeSlide>>>> {
  const session = await requirePermission("content:write");
  const parsed = updateHomeSlideSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const result = await updateHomeSlide(parsed.data, session.user.id);
    revalidateSlides();
    return { ok: true, data: result };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteHomeSlideAction(input: unknown): Promise<HomeSlideActionResult<Awaited<ReturnType<typeof deleteHomeSlide>>>> {
  const session = await requirePermission("content:write");
  const parsed = deleteHomeSlideSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const result = await deleteHomeSlide(parsed.data.id, parsed.data.deleteCloudinaryAsset, session.user.id);
    revalidateSlides();
    return { ok: true, data: result };
  } catch (error) {
    return failure(error);
  }
}

export async function toggleHomeSlideActiveAction(input: unknown): Promise<HomeSlideActionResult<Awaited<ReturnType<typeof toggleHomeSlideActive>>>> {
  const session = await requirePermission("content:write");
  const parsed = toggleHomeSlideActiveSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const result = await toggleHomeSlideActive(parsed.data.id, parsed.data.isActive, session.user.id);
    revalidateSlides();
    return { ok: true, data: result };
  } catch (error) {
    return failure(error);
  }
}

export async function reorderHomeSlideAction(input: unknown): Promise<HomeSlideActionResult<{ success: true }>> {
  const session = await requirePermission("content:write");
  const parsed = reorderHomeSlideSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try {
    await reorderHomeSlide(parsed.data.id, parsed.data.direction, session.user.id);
    revalidateSlides();
    return { ok: true, data: { success: true } };
  } catch (error) {
    return failure(error);
  }
}

export async function setHomeSlideOrderAction(input: unknown): Promise<HomeSlideActionResult<{ success: true }>> {
  const session = await requirePermission("content:write");
  const parsed = setHomeSlideOrderSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try {
    await setHomeSlideOrder(parsed.data.orderedIds, session.user.id);
    revalidateSlides();
    return { ok: true, data: { success: true } };
  } catch (error) {
    return failure(error);
  }
}

export async function updateHomeShowcaseSettingsAction(input: unknown): Promise<HomeSlideActionResult<Awaited<ReturnType<typeof updateHomeShowcaseSettings>>>> {
  const session = await requirePermission("content:write");
  const parsed = updateHomeShowcaseSettingsSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const result = await updateHomeShowcaseSettings(parsed.data, session.user.id);
    revalidateSlides();
    return { ok: true, data: result };
  } catch (error) {
    return failure(error);
  }
}

