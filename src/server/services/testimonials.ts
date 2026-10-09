import "server-only";

import type { Prisma, PublishStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";
import type { CreateTestimonialInput, ReorderTestimonialsInput, TogglePublishTestimonialInput, UpdateTestimonialInput } from "@/lib/validation/testimonials";
import { logActivity } from "@/server/services/activity";

export type TestimonialView = {
  id: string;
  name: string;
  roleOrOrg: string | null;
  quote: string;
  rating: number | null;
  projectId: string | null;
  project: { id: string; title: string; slug: string } | null;
  status: PublishStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type TestimonialRecord = Prisma.TestimonialGetPayload<{ select: typeof testimonialSelect }>;

export class TestimonialNotFoundError extends Error {
  constructor() { super("Testimonial not found."); this.name = "TestimonialNotFoundError"; }
}

export class TestimonialProjectNotFoundError extends Error {
  constructor() { super("The selected project no longer exists."); this.name = "TestimonialProjectNotFoundError"; }
}

const testimonialSelect = {
  id: true,
  name: true,
  roleOrOrg: true,
  quote: true,
  rating: true,
  projectId: true,
  project: { select: { id: true, title: true, slug: true } },
  status: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TestimonialSelect;

function toView(record: TestimonialRecord): TestimonialView {
  return { ...record, createdAt: record.createdAt.toISOString(), updatedAt: record.updatedAt.toISOString() };
}

function nullableString(value: string | undefined): string | null { return value?.trim() ? value.trim() : null; }

async function validateProject(projectId: string | null): Promise<void> {
  if (!projectId) return;
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) throw new TestimonialProjectNotFoundError();
}

function inputData(input: CreateTestimonialInput | UpdateTestimonialInput): Prisma.TestimonialUncheckedCreateInput {
  return { name: input.name, roleOrOrg: nullableString(input.roleOrOrg), quote: input.quote, rating: input.rating, projectId: input.projectId, status: input.status, sortOrder: input.sortOrder };
}

export async function listTestimonials(filters: { q?: string; status?: PublishStatus } = {}): Promise<TestimonialView[]> {
  const q = filters.q?.trim();
  const rows = await prisma.testimonial.findMany({
    where: { ...(filters.status ? { status: filters.status } : {}), ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { roleOrOrg: { contains: q, mode: "insensitive" } }, { quote: { contains: q, mode: "insensitive" } }] } : {}) },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: testimonialSelect,
  });
  return rows.map(toView);
}

export async function getTestimonial(id: string): Promise<TestimonialView | null> {
  const row = await prisma.testimonial.findUnique({ where: { id }, select: testimonialSelect });
  return row ? toView(row) : null;
}

export async function createTestimonial(input: CreateTestimonialInput, userId: string): Promise<TestimonialView> {
  await validateProject(input.projectId);
  const row = await prisma.testimonial.create({ data: inputData(input), select: testimonialSelect });
  await logActivity({ userId, action: "testimonial.create", entityType: "Testimonial", entityId: row.id, summary: `Created testimonial from ${row.name}`, diff: { status: row.status, rating: row.rating, projectId: row.projectId } });
  return toView(row);
}

export async function updateTestimonial(input: UpdateTestimonialInput, userId: string): Promise<TestimonialView> {
  const current = await prisma.testimonial.findUnique({ where: { id: input.id }, select: { id: true } });
  if (!current) throw new TestimonialNotFoundError();
  await validateProject(input.projectId);
  const row = await prisma.testimonial.update({ where: { id: input.id }, data: inputData(input), select: testimonialSelect });
  await logActivity({ userId, action: "testimonial.update", entityType: "Testimonial", entityId: row.id, summary: `Updated testimonial from ${row.name}`, diff: { status: row.status, rating: row.rating, projectId: row.projectId } });
  return toView(row);
}

export async function deleteTestimonial(id: string, userId: string): Promise<{ deleted: true; id: string }> {
  const row = await prisma.testimonial.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!row) throw new TestimonialNotFoundError();
  await prisma.testimonial.delete({ where: { id } });
  await logActivity({ userId, action: "testimonial.delete", entityType: "Testimonial", entityId: id, summary: `Deleted testimonial from ${row.name}` });
  return { deleted: true, id };
}

export async function reorderTestimonials(input: ReorderTestimonialsInput, userId: string): Promise<TestimonialView[]> {
  const rows = await prisma.testimonial.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, sortOrder: true } });
  const index = rows.findIndex((row) => row.id === input.id);
  const current = rows[index];
  const neighbor = rows[input.direction === "up" ? index - 1 : index + 1];
  if (!current || !neighbor) return listTestimonials();
  await prisma.$transaction([
    prisma.testimonial.update({ where: { id: current.id }, data: { sortOrder: neighbor.sortOrder }, select: { id: true } }),
    prisma.testimonial.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder }, select: { id: true } }),
  ]);
  await logActivity({ userId, action: "testimonial.reorder", entityType: "Testimonial", entityId: current.id, summary: `Moved testimonial ${input.direction}`, diff: { direction: input.direction } });
  return listTestimonials();
}

export async function togglePublishTestimonial(input: TogglePublishTestimonialInput, userId: string): Promise<TestimonialView> {
  const current = await prisma.testimonial.findUnique({ where: { id: input.id }, select: { id: true } });
  if (!current) throw new TestimonialNotFoundError();
  const row = await prisma.testimonial.update({ where: { id: input.id }, data: { status: input.published ? "PUBLISHED" : "DRAFT" }, select: testimonialSelect });
  await logActivity({ userId, action: "testimonial.togglePublish", entityType: "Testimonial", entityId: row.id, summary: `${input.published ? "Published" : "Unpublished"} testimonial from ${row.name}`, diff: { status: row.status } });
  return toView(row);
}
