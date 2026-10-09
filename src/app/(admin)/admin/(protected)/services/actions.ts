"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requirePermission } from "@/lib/auth/session";
import { createServiceSchema, deleteServiceSchema, reorderServicesSchema, togglePublishServiceSchema, updateServiceSchema } from "@/lib/validation/services";
import { createService as createServiceRecord, deleteService as deleteServiceRecord, getService, reorderServices as reorderServiceRecords, ServiceNotFoundError, ServiceSlugConflictError, togglePublishService as togglePublishServiceRecord, updateService as updateServiceRecord } from "@/server/services/services";

export type ServiceActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };

function validationError(error: { flatten: () => { fieldErrors: Record<string, string[]> } }): ServiceActionResult<never> {
  return { ok: false, error: { code: "VALIDATION_ERROR", message: "Please correct the highlighted fields.", fieldErrors: error.flatten().fieldErrors } };
}

function failure(error: unknown): ServiceActionResult<never> {
  if (error instanceof ServiceSlugConflictError) return { ok: false, error: { code: "SLUG_NOT_UNIQUE", message: error.message, fieldErrors: { slug: [error.message] } } };
  if (error instanceof ServiceNotFoundError) return { ok: false, error: { code: "NOT_FOUND", message: "The service no longer exists." } };
  return { ok: false, error: { code: "MUTATION_FAILED", message: "The service could not be saved. Please try again." } };
}

function revalidateService(slugs: readonly (string | undefined)[]): void {
  revalidateTag("services", "max");
  for (const slug of slugs) if (slug) revalidateTag(`service:${slug}`, "max");
  revalidatePath("/admin/services");
}

export async function createService(input: unknown): Promise<ServiceActionResult<Awaited<ReturnType<typeof createServiceRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = createServiceSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const result = await createServiceRecord(parsed.data, session.user.id);
    revalidateService([result.slug]);
    return { ok: true, data: result };
  } catch (error) {
    return failure(error);
  }
}

export async function updateService(input: unknown): Promise<ServiceActionResult<Awaited<ReturnType<typeof updateServiceRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = updateServiceSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const previous = await getService(parsed.data.id);
    const result = await updateServiceRecord(parsed.data, session.user.id);
    revalidateService([previous?.slug, result.slug]);
    return { ok: true, data: result };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteService(input: unknown): Promise<ServiceActionResult<Awaited<ReturnType<typeof deleteServiceRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = deleteServiceSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const previous = await getService(parsed.data.id);
    const result = await deleteServiceRecord(parsed.data.id, session.user.id);
    revalidateService([previous?.slug]);
    return { ok: true, data: result };
  } catch (error) {
    return failure(error);
  }
}

export async function reorderServices(input: unknown): Promise<ServiceActionResult<Awaited<ReturnType<typeof reorderServiceRecords>>>> {
  const session = await requirePermission("content:write");
  const parsed = reorderServicesSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const result = await reorderServiceRecords(parsed.data, session.user.id);
    revalidateService(result.map((service) => service.slug));
    return { ok: true, data: result };
  } catch (error) {
    return failure(error);
  }
}

export async function togglePublish(input: unknown): Promise<ServiceActionResult<Awaited<ReturnType<typeof togglePublishServiceRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = togglePublishServiceSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const previous = await getService(parsed.data.id);
    const result = await togglePublishServiceRecord(parsed.data, session.user.id);
    revalidateService([previous?.slug, result.slug]);
    return { ok: true, data: result };
  } catch (error) {
    return failure(error);
  }
}
