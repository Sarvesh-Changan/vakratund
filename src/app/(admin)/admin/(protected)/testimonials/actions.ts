"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requirePermission } from "@/lib/auth/session";
import { createTestimonialSchema, deleteTestimonialSchema, reorderTestimonialsSchema, togglePublishTestimonialSchema, updateTestimonialSchema } from "@/lib/validation/testimonials";
import { createTestimonial as createRecord, deleteTestimonial as deleteRecord, reorderTestimonials as reorderRecords, TestimonialNotFoundError, TestimonialPhotoMustBeImageError, TestimonialPhotoNotFoundError, TestimonialProjectNotFoundError, togglePublishTestimonial as toggleRecord, updateTestimonial as updateRecord } from "@/server/services/testimonials";

export type TestimonialActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };

function validationError(error: { flatten: () => { fieldErrors: Record<string, string[]> } }): TestimonialActionResult<never> { return { ok: false, error: { code: "VALIDATION_ERROR", message: "Please correct the highlighted fields.", fieldErrors: error.flatten().fieldErrors } }; }

function failure(error: unknown): TestimonialActionResult<never> {
  if (error instanceof TestimonialProjectNotFoundError) return { ok: false, error: { code: "PROJECT_NOT_FOUND", message: error.message, fieldErrors: { projectId: [error.message] } } };
  if (error instanceof TestimonialPhotoNotFoundError || error instanceof TestimonialPhotoMustBeImageError) return { ok: false, error: { code: "PHOTO_INVALID", message: error.message, fieldErrors: { photoId: [error.message] } } };
  if (error instanceof TestimonialNotFoundError) return { ok: false, error: { code: "NOT_FOUND", message: "The testimonial no longer exists." } };
  return { ok: false, error: { code: "MUTATION_FAILED", message: "The testimonial could not be saved. Please try again." } };
}

function revalidateTestimonials(): void {
  revalidateTag("testimonials", "max");
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
  revalidatePath("/about");
}

export async function createTestimonial(input: unknown): Promise<TestimonialActionResult<Awaited<ReturnType<typeof createRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = createTestimonialSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await createRecord(parsed.data, session.user.id); revalidateTestimonials(); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function updateTestimonial(input: unknown): Promise<TestimonialActionResult<Awaited<ReturnType<typeof updateRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = updateTestimonialSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await updateRecord(parsed.data, session.user.id); revalidateTestimonials(); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function deleteTestimonial(input: unknown): Promise<TestimonialActionResult<Awaited<ReturnType<typeof deleteRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = deleteTestimonialSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await deleteRecord(parsed.data.id, session.user.id); revalidateTestimonials(); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function reorderTestimonials(input: unknown): Promise<TestimonialActionResult<Awaited<ReturnType<typeof reorderRecords>>>> {
  const session = await requirePermission("content:write");
  const parsed = reorderTestimonialsSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await reorderRecords(parsed.data, session.user.id); revalidateTestimonials(); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function togglePublish(input: unknown): Promise<TestimonialActionResult<Awaited<ReturnType<typeof toggleRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = togglePublishTestimonialSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await toggleRecord(parsed.data, session.user.id); revalidateTestimonials(); return { ok: true, data: result }; } catch (error) { return failure(error); }
}
