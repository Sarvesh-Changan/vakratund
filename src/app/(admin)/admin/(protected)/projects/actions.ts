"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requirePermission } from "@/lib/auth/session";
import { createProjectSchema, deleteProjectSchema, reorderProjectsSchema, togglePublishProjectSchema, updateProjectSchema } from "@/lib/validation/projects";
import { createProject as createProjectRecord, deleteProject as deleteProjectRecord, getProject, ProjectNotFoundError, ProjectPublishValidationError, ProjectServiceNotFoundError, ProjectSlugConflictError, reorderProjects as reorderProjectRecords, togglePublishProject as togglePublishProjectRecord, updateProject as updateProjectRecord } from "@/server/services/projects";

export type ProjectActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };

function validationError(error: { flatten: () => { fieldErrors: Record<string, string[]> } }): ProjectActionResult<never> {
  return { ok: false, error: { code: "VALIDATION_ERROR", message: "Please correct the highlighted fields.", fieldErrors: error.flatten().fieldErrors } };
}

function failure(error: unknown): ProjectActionResult<never> {
  if (error instanceof ProjectPublishValidationError) return { ok: false, error: { code: "PUBLISH_REQUIREMENTS", message: error.message, fieldErrors: error.fieldErrors } };
  if (error instanceof ProjectSlugConflictError) return { ok: false, error: { code: "SLUG_NOT_UNIQUE", message: error.message, fieldErrors: { slug: [error.message] } } };
  if (error instanceof ProjectServiceNotFoundError) return { ok: false, error: { code: "SERVICE_NOT_FOUND", message: error.message, fieldErrors: { serviceId: [error.message] } } };
  if (error instanceof ProjectNotFoundError) return { ok: false, error: { code: "NOT_FOUND", message: "The project no longer exists." } };
  return { ok: false, error: { code: "MUTATION_FAILED", message: "The project could not be saved. Please try again." } };
}

function revalidateProject(slugs: readonly (string | undefined)[]): void {
  revalidateTag("projects", "max");
  for (const slug of slugs) if (slug) revalidateTag(`project:${slug}`, "max");
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
}

export async function createProject(input: unknown): Promise<ProjectActionResult<Awaited<ReturnType<typeof createProjectRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const result = await createProjectRecord(parsed.data, session.user.id);
    revalidateProject([result.slug]);
    return { ok: true, data: result };
  } catch (error) {
    return failure(error);
  }
}

export async function updateProject(input: unknown): Promise<ProjectActionResult<Awaited<ReturnType<typeof updateProjectRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = updateProjectSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const previous = await getProject(parsed.data.id);
    const result = await updateProjectRecord(parsed.data, session.user.id);
    revalidateProject([previous?.slug, result.slug]);
    return { ok: true, data: result };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteProject(input: unknown): Promise<ProjectActionResult<Awaited<ReturnType<typeof deleteProjectRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = deleteProjectSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const previous = await getProject(parsed.data.id);
    const result = await deleteProjectRecord(parsed.data.id, session.user.id);
    revalidateProject([previous?.slug]);
    return { ok: true, data: result };
  } catch (error) {
    return failure(error);
  }
}

export async function reorderProjects(input: unknown): Promise<ProjectActionResult<Awaited<ReturnType<typeof reorderProjectRecords>>>> {
  const session = await requirePermission("content:write");
  const parsed = reorderProjectsSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const result = await reorderProjectRecords(parsed.data, session.user.id);
    revalidateProject(result.map((project) => project.slug));
    return { ok: true, data: result };
  } catch (error) {
    return failure(error);
  }
}

export async function togglePublish(input: unknown): Promise<ProjectActionResult<Awaited<ReturnType<typeof togglePublishProjectRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = togglePublishProjectSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const previous = await getProject(parsed.data.id);
    const result = await togglePublishProjectRecord(parsed.data, session.user.id);
    revalidateProject([previous?.slug, result.slug]);
    return { ok: true, data: result };
  } catch (error) {
    return failure(error);
  }
}

