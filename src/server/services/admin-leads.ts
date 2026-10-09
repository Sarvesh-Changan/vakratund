import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { LeadStatus, LeadType, Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/client";
import type { AdminLeadFilters, AddLeadNoteInput, UpdateLeadAssignmentInput, UpdateLeadStatusInput } from "@/lib/validation/admin-leads";
import { logActivity } from "@/server/services/activity";
import { notifyLeadCreated } from "@/server/notifications/leads";

export type LeadActor = { id: string; role: Role | string };
export type LeadScope = { OR?: Prisma.LeadWhereInput[]; deletedAt: null };

const leadSelect = {
  id: true, publicId: true, type: true, status: true, name: true, phone: true, email: true,
  location: true, message: true, sourcePage: true, referrer: true, utmSource: true, utmMedium: true,
  utmCampaign: true, utmTerm: true, utmContent: true, deviceType: true, isDuplicate: true,
  assignedToId: true, followUpAt: true, createdAt: true, updatedAt: true,
  assignedTo: { select: { id: true, name: true, email: true, role: true } },
  quote: { select: { id: true, estimatorServiceId: true, areaValue: true, answers: true, breakdown: true, configSnapshot: true, configVersion: true, configHash: true, lowAmount: true, highAmount: true, createdAt: true, estimatorService: { select: { name: true, pricingMode: true } }, locationZone: { select: { name: true } } } },
} satisfies Prisma.LeadSelect;

export type AdminLeadRow = Prisma.LeadGetPayload<{ select: typeof leadSelect }>;

export function leadScope(actor: LeadActor): LeadScope {
  if (actor.role === "SALES") return { deletedAt: null, OR: [{ assignedToId: actor.id }, { assignedToId: null }] };
  if (actor.role === "ADMIN" || actor.role === "SUPER_ADMIN") return { deletedAt: null };
  throw new Error("Forbidden.");
}

function assertAdmin(actor: LeadActor): void {
  if (actor.role !== "ADMIN" && actor.role !== "SUPER_ADMIN") throw new Error("Forbidden.");
}

function dateValue(value: string | undefined, end = false): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : new Date(date.getTime() + (end ? 86_400_000 : 0));
}

export function buildLeadWhere(filters: AdminLeadFilters, actor: LeadActor): Prisma.LeadWhereInput {
  const scope = leadScope(actor);
  const where: Prisma.LeadWhereInput = { ...scope };
  const and: Prisma.LeadWhereInput[] = [];
  if (filters.q) and.push({ OR: [
    { name: { contains: filters.q, mode: "insensitive" } },
    { phone: { contains: filters.q, mode: "insensitive" } },
    { email: { contains: filters.q, mode: "insensitive" } },
    { publicId: { contains: filters.q, mode: "insensitive" } },
  ] });
  if (filters.status) and.push({ status: filters.status });
  if (filters.type) and.push({ type: filters.type });
  if (filters.assignee) and.push({ OR: [{ assignedToId: filters.assignee }, { assignedTo: { is: { name: { contains: filters.assignee, mode: "insensitive" } } } }] });
  if (filters.sourcePage) and.push({ sourcePage: { contains: filters.sourcePage, mode: "insensitive" } });
  const from = dateValue(filters.from);
  const to = dateValue(filters.to, true);
  if (from || to) and.push({ createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } });
  if (and.length) where.AND = and;
  return where;
}

export async function listAdminLeads(filters: AdminLeadFilters, actor: LeadActor) {
  const where = buildLeadWhere(filters, actor);
  const orderBy: Prisma.LeadOrderByWithRelationInput = { [filters.sort]: filters.direction };
  const [rows, total] = await prisma.$transaction([
    prisma.lead.findMany({ where, orderBy: [orderBy, { id: "desc" }], skip: (filters.page - 1) * filters.pageSize, take: filters.pageSize, select: leadSelect }),
    prisma.lead.count({ where }),
  ]);
  return { rows, total, page: filters.page, pageSize: filters.pageSize, pageCount: Math.max(1, Math.ceil(total / filters.pageSize)) };
}

export async function listAssignees() {
  return prisma.user.findMany({ where: { isActive: true, role: { in: ["ADMIN", "SUPER_ADMIN", "SALES"] } }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true, role: true } });
}

export async function getAdminLead(id: string, actor: LeadActor) {
  const row = await prisma.lead.findFirst({ where: { AND: [leadScope(actor), { id }] }, select: { ...leadSelect, history: { orderBy: { createdAt: "asc" }, select: { id: true, fromStatus: true, toStatus: true, changedBy: true, createdAt: true } }, notes: { orderBy: { createdAt: "asc" }, select: { id: true, body: true, createdAt: true, author: { select: { id: true, name: true, email: true } } } }, emailLogs: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, type: true, status: true, errorCode: true, createdAt: true } } } });
  if (!row) throw new Error("Lead not found.");
  return row;
}

export async function resendLeadEmails(input: { leadId: string; mode: "admin" | "visitor" | "both" }, actor: LeadActor) {
  const lead = await prisma.lead.findFirst({ where: { AND: [leadScope(actor), { id: input.leadId }] }, select: { id: true } });
  if (!lead) throw new Error("Lead not found or outside your scope.");
  await notifyLeadCreated(input.leadId, { admin: input.mode === "admin" || input.mode === "both", visitor: input.mode === "visitor" || input.mode === "both" });
  await logActivity({ userId: actor.id, action: "lead.email.resend", entityType: "Lead", entityId: input.leadId, summary: "Requested lead email resend", diff: { mode: input.mode } });
}

const statusOrder: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "CLOSED"];
export function isReopen(from: LeadStatus, to: LeadStatus): boolean { return from === "CLOSED" && to !== "CLOSED"; }
export function canChangeStatus(from: LeadStatus, to: LeadStatus): boolean { return from === to || (from !== "CLOSED" && statusOrder.includes(to)) || isReopen(from, to); }

async function ensureScopedLead(tx: Prisma.TransactionClient, leadId: string, actor: LeadActor) {
  const row = await tx.lead.findFirst({ where: { AND: [leadScope(actor), { id: leadId }] }, select: { id: true, status: true, assignedToId: true } });
  if (!row) throw new Error("Lead not found or outside your scope.");
  return row;
}

export async function updateLeadStatus(input: UpdateLeadStatusInput, actor: LeadActor) {
  let result: { id: string; from: LeadStatus; to: LeadStatus };
  await prisma.$transaction(async (tx) => {
    const lead = await ensureScopedLead(tx, input.leadId, actor);
    if (!canChangeStatus(lead.status, input.status)) throw new Error("Invalid status transition.");
    if (isReopen(lead.status, input.status) && !input.reason?.trim()) throw new Error("A reason is required when reopening a lead.");
    if (lead.status === input.status) { result = { id: lead.id, from: lead.status, to: input.status }; return; }
    await tx.lead.update({ where: { id: lead.id }, data: { status: input.status } });
    await tx.leadStatusHistory.create({ data: { leadId: lead.id, fromStatus: lead.status, toStatus: input.status, changedBy: actor.id } });
    result = { id: lead.id, from: lead.status, to: input.status };
  });
  if (result!.from !== result!.to) await logActivity({ userId: actor.id, action: "lead.status.update", entityType: "Lead", entityId: result!.id, summary: `Changed lead status to ${result!.to}`, diff: { from: result!.from, to: result!.to, reason: input.reason ?? null } });
  return result!;
}

export async function addLeadNote(input: AddLeadNoteInput, actor: LeadActor) {
  let noteId = "";
  await prisma.$transaction(async (tx) => {
    await ensureScopedLead(tx, input.leadId, actor);
    const note = await tx.leadNote.create({ data: { leadId: input.leadId, authorId: actor.id, body: input.body }, select: { id: true } });
    noteId = note.id;
  });
  await logActivity({ userId: actor.id, action: "lead.note.create", entityType: "Lead", entityId: input.leadId, summary: "Added a lead note", diff: { noteId } });
  return { id: noteId };
}

export async function updateLeadAssignment(input: UpdateLeadAssignmentInput, actor: LeadActor) {
  let result: { id: string; assignedToId: string | null; followUpAt: Date | null };
  await prisma.$transaction(async (tx) => {
    const lead = await ensureScopedLead(tx, input.leadId, actor);
    if (actor.role === "SALES" && input.assignedToId !== null && input.assignedToId !== actor.id) throw new Error("Sales users may only assign leads to themselves or leave them unassigned.");
    if (input.assignedToId) {
      const assignee = await tx.user.findFirst({ where: { id: input.assignedToId, isActive: true }, select: { id: true } });
      if (!assignee) throw new Error("Assignee not found.");
    }
    const followUpAt = input.followUpAt ? new Date(input.followUpAt) : null;
    await tx.lead.update({ where: { id: lead.id }, data: { assignedToId: input.assignedToId, followUpAt } });
    result = { id: lead.id, assignedToId: input.assignedToId, followUpAt };
  });
  await logActivity({ userId: actor.id, action: "lead.assignment.update", entityType: "Lead", entityId: result!.id, summary: "Updated lead ownership and follow-up", diff: { assignedToId: result!.assignedToId, followUpAt: result!.followUpAt?.toISOString() ?? null } });
  return result!;
}

export async function softDeleteLead(id: string, actor: LeadActor) {
  assertAdmin(actor);
  await prisma.$transaction(async (tx) => { await ensureScopedLead(tx, id, actor); await tx.lead.update({ where: { id }, data: { deletedAt: new Date() } }); });
  await logActivity({ userId: actor.id, action: "lead.delete", entityType: "Lead", entityId: id, summary: "Soft-deleted a lead", diff: { deleted: true } });
}

export function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  const safe = /^[=+\-@]/.test(text) ? `\t${text}` : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export function leadsToCsv(rows: readonly Pick<AdminLeadRow, "publicId" | "name" | "phone" | "email" | "type" | "status" | "sourcePage" | "isDuplicate" | "createdAt">[]): string {
  const header = ["Reference", "Name", "Phone", "Email", "Type", "Status", "Source page", "Duplicate", "Created"].map(csvCell).join(",");
  const lines = rows.map((row) => [row.publicId, row.name, row.phone, row.email, row.type, row.status, row.sourcePage, row.isDuplicate, row.createdAt.toISOString()].map(csvCell).join(","));
  return `${header}\n${lines.join("\n")}\n`;
}

export async function exportAdminLeads(actor: LeadActor) {
  assertAdmin(actor);
  const rows = await prisma.lead.findMany({ where: leadScope(actor), orderBy: { createdAt: "desc" }, select: { publicId: true, name: true, phone: true, email: true, type: true, status: true, sourcePage: true, isDuplicate: true, createdAt: true } });
  return leadsToCsv(rows);
}

export type LeadStatusValue = LeadStatus;
export type LeadTypeValue = LeadType;
