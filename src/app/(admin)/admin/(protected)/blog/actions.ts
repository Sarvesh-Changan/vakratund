"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requirePermission } from "@/lib/auth/session";
import { createBlogCategorySchema, createBlogPostSchema, deleteBlogCategorySchema, deleteBlogPostSchema, togglePublishBlogPostSchema, updateBlogCategorySchema, updateBlogPostSchema } from "@/lib/validation/blog";
import { BlogCategoryNotFoundError, BlogCategorySlugConflictError, BlogCoverMustBeImageError, BlogPostNotFoundError, BlogRelationNotFoundError, BlogSlugConflictError, createBlogCategory as createCategoryRecord, createBlogPost as createPostRecord, deleteBlogCategory as deleteCategoryRecord, deleteBlogPost as deletePostRecord, getBlogPost, togglePublishBlogPost as togglePostRecord, updateBlogCategory as updateCategoryRecord, updateBlogPost as updatePostRecord } from "@/server/services/blog";

export type BlogActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };

function validationError(error: { flatten: () => { fieldErrors: Record<string, string[]> } }): BlogActionResult<never> { return { ok: false, error: { code: "VALIDATION_ERROR", message: "Please correct the highlighted fields.", fieldErrors: error.flatten().fieldErrors } }; }

function failure(error: unknown): BlogActionResult<never> {
  if (error instanceof BlogSlugConflictError || error instanceof BlogCategorySlugConflictError) return { ok: false, error: { code: "SLUG_NOT_UNIQUE", message: error.message, fieldErrors: { slug: [error.message] } } };
  if (error instanceof BlogRelationNotFoundError) return { ok: false, error: { code: "RELATION_NOT_FOUND", message: error.message, fieldErrors: { [error.field]: [error.message] } } };
  if (error instanceof BlogCoverMustBeImageError) return { ok: false, error: { code: "COVER_INVALID", message: error.message, fieldErrors: { coverId: [error.message] } } };
  if (error instanceof BlogPostNotFoundError || error instanceof BlogCategoryNotFoundError) return { ok: false, error: { code: "NOT_FOUND", message: "The blog record no longer exists." } };
  return { ok: false, error: { code: "MUTATION_FAILED", message: "The blog content could not be saved. Please try again." } };
}

function revalidateBlog(slugs: readonly (string | undefined)[]): void {
  revalidateTag("blog", "max");
  for (const slug of slugs) if (slug) { revalidateTag(`post:${slug}`, "max"); revalidatePath(`/blog/${slug}`); }
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function createBlogPost(input: unknown): Promise<BlogActionResult<Awaited<ReturnType<typeof createPostRecord>>>> {
  const session = await requirePermission("content:write"); const parsed = createBlogPostSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  try { const result = await createPostRecord(parsed.data, session.user.id); revalidateBlog([result.slug]); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function updateBlogPost(input: unknown): Promise<BlogActionResult<Awaited<ReturnType<typeof updatePostRecord>>>> {
  const session = await requirePermission("content:write"); const parsed = updateBlogPostSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  try { const previous = await getBlogPost(parsed.data.id); const result = await updatePostRecord(parsed.data, session.user.id); revalidateBlog([previous?.slug, result.slug]); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function deleteBlogPost(input: unknown): Promise<BlogActionResult<Awaited<ReturnType<typeof deletePostRecord>>>> {
  const session = await requirePermission("content:write"); const parsed = deleteBlogPostSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  try { const previous = await getBlogPost(parsed.data.id); const result = await deletePostRecord(parsed.data.id, session.user.id); revalidateBlog([previous?.slug]); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function togglePublish(input: unknown): Promise<BlogActionResult<Awaited<ReturnType<typeof togglePostRecord>>>> {
  const session = await requirePermission("content:write"); const parsed = togglePublishBlogPostSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  try { const previous = await getBlogPost(parsed.data.id); const result = await togglePostRecord(parsed.data, session.user.id); revalidateBlog([previous?.slug, result.slug]); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function createCategory(input: unknown): Promise<BlogActionResult<Awaited<ReturnType<typeof createCategoryRecord>>>> {
  const session = await requirePermission("content:write"); const parsed = createBlogCategorySchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  try { const result = await createCategoryRecord(parsed.data, session.user.id); revalidateBlog([]); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function updateCategory(input: unknown): Promise<BlogActionResult<Awaited<ReturnType<typeof updateCategoryRecord>>>> {
  const session = await requirePermission("content:write"); const parsed = updateBlogCategorySchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  try { const result = await updateCategoryRecord(parsed.data, session.user.id); revalidateBlog([]); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function deleteCategory(input: unknown): Promise<BlogActionResult<Awaited<ReturnType<typeof deleteCategoryRecord>>>> {
  const session = await requirePermission("content:write"); const parsed = deleteBlogCategorySchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  try { const result = await deleteCategoryRecord(parsed.data.id, session.user.id); revalidateBlog([]); return { ok: true, data: result }; } catch (error) { return failure(error); }
}
