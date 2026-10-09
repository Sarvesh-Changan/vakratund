"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requirePermission } from "@/lib/auth/session";
import { createTeamMemberSchema, deleteTeamMemberSchema, reorderTeamMembersSchema, toggleTeamVisibilitySchema, updateTeamMemberSchema } from "@/lib/validation/team";
import { createTeamMember as createRecord, deleteTeamMember as deleteRecord, reorderTeamMembers as reorderRecords, TeamMemberNotFoundError, TeamPhotoMustBeImageError, TeamPhotoNotFoundError, toggleTeamVisibility as toggleRecord, updateTeamMember as updateRecord } from "@/server/services/team";

export type TeamActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };

function validationError(error: { flatten: () => { fieldErrors: Record<string, string[]> } }): TeamActionResult<never> { return { ok: false, error: { code: "VALIDATION_ERROR", message: "Please correct the highlighted fields.", fieldErrors: error.flatten().fieldErrors } }; }

function failure(error: unknown): TeamActionResult<never> {
  if (error instanceof TeamPhotoNotFoundError || error instanceof TeamPhotoMustBeImageError) return { ok: false, error: { code: "PHOTO_INVALID", message: error.message, fieldErrors: { photoId: [error.message] } } };
  if (error instanceof TeamMemberNotFoundError) return { ok: false, error: { code: "NOT_FOUND", message: "The team member no longer exists." } };
  return { ok: false, error: { code: "MUTATION_FAILED", message: "The team member could not be saved. Please try again." } };
}

function revalidateTeam(): void {
  revalidateTag("team", "max");
  revalidatePath("/admin/team");
  revalidatePath("/about");
}

export async function createTeamMember(input: unknown): Promise<TeamActionResult<Awaited<ReturnType<typeof createRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = createTeamMemberSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await createRecord(parsed.data, session.user.id); revalidateTeam(); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function updateTeamMember(input: unknown): Promise<TeamActionResult<Awaited<ReturnType<typeof updateRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = updateTeamMemberSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await updateRecord(parsed.data, session.user.id); revalidateTeam(); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function deleteTeamMember(input: unknown): Promise<TeamActionResult<Awaited<ReturnType<typeof deleteRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = deleteTeamMemberSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await deleteRecord(parsed.data.id, session.user.id); revalidateTeam(); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function reorderTeamMembers(input: unknown): Promise<TeamActionResult<Awaited<ReturnType<typeof reorderRecords>>>> {
  const session = await requirePermission("content:write");
  const parsed = reorderTeamMembersSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await reorderRecords(parsed.data, session.user.id); revalidateTeam(); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

export async function toggleVisibility(input: unknown): Promise<TeamActionResult<Awaited<ReturnType<typeof toggleRecord>>>> {
  const session = await requirePermission("content:write");
  const parsed = toggleTeamVisibilitySchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await toggleRecord(parsed.data, session.user.id); revalidateTeam(); return { ok: true, data: result }; } catch (error) { return failure(error); }
}

