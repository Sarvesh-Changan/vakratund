"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requirePermission } from "@/lib/auth/session";
import { createFaqSchema, deleteFaqSchema, reorderFaqsSchema, togglePublishFaqSchema, updateFaqSchema } from "@/lib/validation/faqs";
import { createFaq as createRecord, deleteFaq as deleteRecord, FaqNotFoundError, FaqServiceNotFoundError, reorderFaqs as reorderRecords, togglePublishFaq as toggleRecord, updateFaq as updateRecord } from "@/server/services/faqs";

export type FaqActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };

function validationError(error: { flatten: () => { fieldErrors: Record<string, string[]> } }): FaqActionResult<never> { return { ok: false, error: { code: "VALIDATION_ERROR", message: "Please correct the highlighted fields.", fieldErrors: error.flatten().fieldErrors } }; }

function failure(error: unknown): FaqActionResult<never> {
  if (error instanceof FaqServiceNotFoundError) return { ok: false, error: { code: "SERVICE_NOT_FOUND", message: error.message, fieldErrors: { serviceId: [error.message] } } };
  if (error instanceof FaqNotFoundError) return { ok: false, error: { code: "NOT_FOUND", message: "The FAQ no longer exists." } };
  return { ok: false, error: { code: "MUTATION_FAILED", message: "The FAQ could not be saved. Please try again." } };
}

function revalidateFaqs(): void {
  revalidateTag("faqs", "max");
  revalidatePath("/admin/faqs");
  revalidatePath("/faqs");
  revalidatePath("/services");
}

export async function createFaq(input: unknown): Promise<FaqActionResult<Awaited<ReturnType<typeof createRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = createFaqSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await createRecord(parsed.data, session.user.id); revalidateFaqs(); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function updateFaq(input: unknown): Promise<FaqActionResult<Awaited<ReturnType<typeof updateRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = updateFaqSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await updateRecord(parsed.data, session.user.id); revalidateFaqs(); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function deleteFaq(input: unknown): Promise<FaqActionResult<Awaited<ReturnType<typeof deleteRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = deleteFaqSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await deleteRecord(parsed.data.id, session.user.id); revalidateFaqs(); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function reorderFaqs(input: unknown): Promise<FaqActionResult<Awaited<ReturnType<typeof reorderRecords>>>> {
  const session = await requirePermission("content:write");
  const parsed = reorderFaqsSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await reorderRecords(parsed.data, session.user.id); revalidateFaqs(); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function togglePublish(input: unknown): Promise<FaqActionResult<Awaited<ReturnType<typeof toggleRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = togglePublishFaqSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await toggleRecord(parsed.data, session.user.id); revalidateFaqs(); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

