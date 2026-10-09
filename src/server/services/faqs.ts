import "server-only";

import type { Prisma, PublishStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";
import type { CreateFaqInput, ReorderFaqsInput, TogglePublishFaqInput, UpdateFaqInput } from "@/lib/validation/faqs";
import { logActivity } from "@/server/services/activity";

export type FaqView = {
  id: string;
  question: string;
  answer: string;
  serviceId: string | null;
  service: { id: string; title: string; slug: string } | null;
  status: PublishStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type FaqRecord = Prisma.FaqGetPayload<{ select: typeof faqSelect }>;

export class FaqNotFoundError extends Error {
  constructor() { super("FAQ not found."); this.name = "FaqNotFoundError"; }
}

export class FaqServiceNotFoundError extends Error {
  constructor() { super("The selected service no longer exists."); this.name = "FaqServiceNotFoundError"; }
}

const faqSelect = {
  id: true,
  question: true,
  answer: true,
  serviceId: true,
  service: { select: { id: true, title: true, slug: true } },
  status: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FaqSelect;

function toView(record: FaqRecord): FaqView {
  return { ...record, createdAt: record.createdAt.toISOString(), updatedAt: record.updatedAt.toISOString() };
}

async function validateService(serviceId: string | null): Promise<void> {
  if (!serviceId) return;
  const service = await prisma.service.findUnique({ where: { id: serviceId }, select: { id: true } });
  if (!service) throw new FaqServiceNotFoundError();
}

function inputData(input: CreateFaqInput | UpdateFaqInput): Prisma.FaqUncheckedCreateInput {
  return { question: input.question, answer: input.answer, serviceId: input.serviceId, status: input.status, sortOrder: input.sortOrder };
}

export async function listFaqs(filters: { q?: string; status?: PublishStatus; serviceId?: string | null } = {}): Promise<FaqView[]> {
  const q = filters.q?.trim();
  const rows = await prisma.faq.findMany({
    where: { ...(filters.status ? { status: filters.status } : {}), ...(filters.serviceId !== undefined ? { serviceId: filters.serviceId } : {}), ...(q ? { OR: [{ question: { contains: q, mode: "insensitive" } }, { answer: { contains: q, mode: "insensitive" } }] } : {}) },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: faqSelect,
  });
  return rows.map(toView);
}

export async function getFaq(id: string): Promise<FaqView | null> {
  const row = await prisma.faq.findUnique({ where: { id }, select: faqSelect });
  return row ? toView(row) : null;
}

export async function createFaq(input: CreateFaqInput, userId: string): Promise<FaqView> {
  await validateService(input.serviceId);
  const row = await prisma.faq.create({ data: inputData(input), select: faqSelect });
  await logActivity({ userId, action: "faq.create", entityType: "Faq", entityId: row.id, summary: `Created FAQ ${row.question}`, diff: { status: row.status, serviceId: row.serviceId } });
  return toView(row);
}

export async function updateFaq(input: UpdateFaqInput, userId: string): Promise<FaqView> {
  const current = await prisma.faq.findUnique({ where: { id: input.id }, select: { id: true } });
  if (!current) throw new FaqNotFoundError();
  await validateService(input.serviceId);
  const row = await prisma.faq.update({ where: { id: input.id }, data: inputData(input), select: faqSelect });
  await logActivity({ userId, action: "faq.update", entityType: "Faq", entityId: row.id, summary: `Updated FAQ ${row.question}`, diff: { status: row.status, serviceId: row.serviceId } });
  return toView(row);
}

export async function deleteFaq(id: string, userId: string): Promise<{ deleted: true; id: string }> {
  const row = await prisma.faq.findUnique({ where: { id }, select: { id: true, question: true } });
  if (!row) throw new FaqNotFoundError();
  await prisma.faq.delete({ where: { id } });
  await logActivity({ userId, action: "faq.delete", entityType: "Faq", entityId: id, summary: `Deleted FAQ ${row.question}` });
  return { deleted: true, id };
}

export async function reorderFaqs(input: ReorderFaqsInput, userId: string): Promise<FaqView[]> {
  const rows = await prisma.faq.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, sortOrder: true } });
  const index = rows.findIndex((row) => row.id === input.id);
  const current = rows[index];
  const neighbor = rows[input.direction === "up" ? index - 1 : index + 1];
  if (!current || !neighbor) return listFaqs();
  await prisma.$transaction([
    prisma.faq.update({ where: { id: current.id }, data: { sortOrder: neighbor.sortOrder }, select: { id: true } }),
    prisma.faq.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder }, select: { id: true } }),
  ]);
  await logActivity({ userId, action: "faq.reorder", entityType: "Faq", entityId: current.id, summary: `Moved FAQ ${input.direction}`, diff: { direction: input.direction } });
  return listFaqs();
}

export async function togglePublishFaq(input: TogglePublishFaqInput, userId: string): Promise<FaqView> {
  const current = await prisma.faq.findUnique({ where: { id: input.id }, select: { id: true } });
  if (!current) throw new FaqNotFoundError();
  const row = await prisma.faq.update({ where: { id: input.id }, data: { status: input.published ? "PUBLISHED" : "DRAFT" }, select: faqSelect });
  await logActivity({ userId, action: "faq.togglePublish", entityType: "Faq", entityId: row.id, summary: `${input.published ? "Published" : "Unpublished"} FAQ ${row.question}`, diff: { status: row.status } });
  return toView(row);
}
