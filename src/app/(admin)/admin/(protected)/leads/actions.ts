"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/auth/session";
import type { Role } from "@/generated/prisma/enums";
import { addLeadNoteSchema, leadIdSchema, resendLeadEmailSchema, updateLeadAssignmentSchema, updateLeadStatusSchema } from "@/lib/validation/admin-leads";
import { addLeadNote, exportAdminLeads, resendLeadEmails, softDeleteLead, updateLeadAssignment, updateLeadStatus } from "@/server/services/admin-leads";
import { checkEmailResendLimit } from "@/lib/rate-limit/email-resend";

type ActionFailure = { ok: false; error: { _form: string[] } };
type ActionResult<T> = { ok: true; data: T } | ActionFailure;
function invalid(message = "Please check the submitted fields."): ActionFailure { return { ok: false, error: { _form: [message] } }; }
function refresh(id?: string) { revalidatePath("/admin/leads"); revalidatePath("/admin/quotes"); if (id) revalidatePath(`/admin/leads/${id}`); }

export async function updateLeadStatusAction(input: unknown): Promise<ActionResult<unknown>> {
  const session = await requirePermission("leads:write");
  const parsed = updateLeadStatusSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  try { const data = await updateLeadStatus(parsed.data, { id: session.user.id, role: session.user.role as Role }); refresh(parsed.data.leadId); return { ok: true, data }; } catch (error) { return invalid(error instanceof Error ? error.message : undefined); }
}

export async function addLeadNoteAction(input: unknown): Promise<ActionResult<unknown>> {
  const session = await requirePermission("leads:write");
  const parsed = addLeadNoteSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  try { const data = await addLeadNote(parsed.data, { id: session.user.id, role: session.user.role as Role }); refresh(parsed.data.leadId); return { ok: true, data }; } catch (error) { return invalid(error instanceof Error ? error.message : undefined); }
}

export async function updateLeadAssignmentAction(input: unknown): Promise<ActionResult<unknown>> {
  const session = await requirePermission("leads:write");
  const parsed = updateLeadAssignmentSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  try { const data = await updateLeadAssignment(parsed.data, { id: session.user.id, role: session.user.role as Role }); refresh(parsed.data.leadId); return { ok: true, data }; } catch (error) { return invalid(error instanceof Error ? error.message : undefined); }
}

export async function deleteLeadAction(input: unknown): Promise<ActionResult<undefined>> {
  const session = await requirePermission("leads:delete");
  const parsed = leadIdSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  try { await softDeleteLead(parsed.data.leadId, { id: session.user.id, role: session.user.role as Role }); refresh(); return { ok: true, data: undefined }; } catch (error) { return invalid(error instanceof Error ? error.message : undefined); }
}

export async function exportLeadsAction(): Promise<ActionResult<string>> {
  const session = await requirePermission("leads:export");
  try { return { ok: true, data: await exportAdminLeads({ id: session.user.id, role: session.user.role as Role }) }; } catch (error) { return invalid(error instanceof Error ? error.message : undefined); }
}

export async function resendLeadEmailAction(input: unknown): Promise<ActionResult<undefined>> {
  const session = await requirePermission("leads:write");
  const parsed = resendLeadEmailSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const rate = checkEmailResendLimit(session.user.id, parsed.data.leadId);
  if (!rate.allowed) return invalid("Too many resend attempts. Please try again later.");
  try { await resendLeadEmails(parsed.data, { id: session.user.id, role: session.user.role as Role }); refresh(parsed.data.leadId); return { ok: true, data: undefined }; } catch (error) { return invalid(error instanceof Error ? error.message : undefined); }
}
