import "server-only";

import type { Prisma, PublishStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";
import { slugify } from "@/lib/utils";
import type { CreateServiceInput, ReorderServicesInput, TogglePublishServiceInput, UpdateServiceInput } from "@/lib/validation/services";
import { logActivity } from "@/server/services/activity";

export type ServiceView = {
  id: string;
  title: string;
  slug: string;
  group: string | null;
  shortDesc: string;
  description: string;
  scopeItems: string[];
  processSteps: string[];
  typicalProjects: string | null;
  audience: string | null;
  iconKey: string | null;
  coverId: string | null;
  status: PublishStatus;
  isFeatured: boolean;
  sortOrder: number;
  seoTitle: string | null;
  seoDesc: string | null;
  createdAt: string;
  updatedAt: string;
};

type ServiceRecord = Omit<ServiceView, "createdAt" | "updatedAt"> & { createdAt: Date; updatedAt: Date };

export class ServiceSlugConflictError extends Error {
  constructor() {
    super("That slug is already in use.");
    this.name = "ServiceSlugConflictError";
  }
}

export class ServiceNotFoundError extends Error {
  constructor() {
    super("Service not found.");
    this.name = "ServiceNotFoundError";
  }
}

export class ServiceSlugInvalidError extends Error {
  constructor() {
    super("The title must produce a valid slug.");
    this.name = "ServiceSlugInvalidError";
  }
}

const serviceSelect = {
  id: true,
  title: true,
  slug: true,
  group: true,
  shortDesc: true,
  description: true,
  scopeItems: true,
  processSteps: true,
  typicalProjects: true,
  audience: true,
  iconKey: true,
  coverId: true,
  status: true,
  isFeatured: true,
  sortOrder: true,
  seoTitle: true,
  seoDesc: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ServiceSelect;

function toView(record: ServiceRecord): ServiceView {
  return { ...record, createdAt: record.createdAt.toISOString(), updatedAt: record.updatedAt.toISOString() };
}

function inputData(input: CreateServiceInput | UpdateServiceInput, slug: string): Prisma.ServiceCreateInput {
  return {
    title: input.title,
    slug,
    group: input.group || null,
    shortDesc: input.shortDesc,
    description: input.description,
    scopeItems: input.scopeItems,
    processSteps: input.processSteps,
    typicalProjects: input.typicalProjects || null,
    audience: input.audience || null,
    iconKey: input.iconKey,
    coverId: input.coverId,
    isFeatured: input.isFeatured,
    status: input.status,
    sortOrder: input.sortOrder,
    seoTitle: input.seoTitle || null,
    seoDesc: input.seoDesc || null,
  };
}

async function uniqueSlug(input: CreateServiceInput | UpdateServiceInput, excludeId?: string): Promise<string> {
  const candidate = slugify(input.slug || input.title);
  if (!candidate) throw new ServiceSlugInvalidError();
  const existing = await prisma.service.findFirst({ where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } });
  if (existing) throw new ServiceSlugConflictError();
  return candidate;
}

export async function listServices(filters: { q?: string; status?: PublishStatus } = {}): Promise<ServiceView[]> {
  const q = filters.q?.trim();
  const records = await prisma.service.findMany({
    where: { ...(filters.status ? { status: filters.status } : {}), ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] } : {}) },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: serviceSelect,
  });
  return records.map((record) => toView(record));
}

export async function getService(id: string): Promise<ServiceView | null> {
  const record = await prisma.service.findUnique({ where: { id }, select: serviceSelect });
  return record ? toView(record) : null;
}

/** Creates a service and records the actor's sanitized mutation. */
export async function createService(input: CreateServiceInput, userId: string): Promise<ServiceView> {
  const serviceSlug = await uniqueSlug(input);
  const record = await prisma.service.create({ data: inputData(input, serviceSlug), select: serviceSelect });
  await logActivity({ userId, action: "service.create", entityType: "Service", entityId: record.id, summary: `Created service ${record.title}`, diff: { slug: record.slug, status: record.status, isFeatured: record.isFeatured } });
  return toView(record);
}

/** Updates a service, checking the editable slug against every other service. */
export async function updateService(input: UpdateServiceInput, userId: string): Promise<ServiceView> {
  const serviceSlug = await uniqueSlug(input, input.id);
  const record = await prisma.service.update({ where: { id: input.id }, data: inputData(input, serviceSlug), select: serviceSelect });
  await logActivity({ userId, action: "service.update", entityType: "Service", entityId: record.id, summary: `Updated service ${record.title}`, diff: { slug: record.slug, status: record.status, isFeatured: record.isFeatured } });
  return toView(record);
}

export async function deleteService(id: string, userId: string): Promise<{ deleted: true; id: string }> {
  const record = await prisma.service.findUnique({ where: { id }, select: { id: true, title: true, slug: true } });
  if (!record) throw new ServiceNotFoundError();
  await prisma.service.delete({ where: { id } });
  await logActivity({ userId, action: "service.delete", entityType: "Service", entityId: id, summary: `Deleted service ${record.title}`, diff: { slug: record.slug } });
  return { deleted: true, id };
}

export async function reorderServices(input: ReorderServicesInput, userId: string): Promise<ServiceView[]> {
  const rows = await prisma.service.findMany({ orderBy: [{ sortOrder: "asc" }, { title: "asc" }], select: { id: true, title: true, sortOrder: true } });
  const index = rows.findIndex((row) => row.id === input.id);
  const neighborIndex = input.direction === "up" ? index - 1 : index + 1;
  const current = rows[index];
  const neighbor = rows[neighborIndex];
  if (!current || !neighbor) return listServices();

  await prisma.$transaction([
    prisma.service.update({ where: { id: current.id }, data: { sortOrder: neighbor.sortOrder } }),
    prisma.service.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder } }),
  ]);
  await logActivity({ userId, action: "service.reorder", entityType: "Service", entityId: current.id, summary: `Moved service ${input.direction}`, diff: { direction: input.direction } });
  return listServices();
}

export async function togglePublishService(input: TogglePublishServiceInput, userId: string): Promise<ServiceView> {
  const current = await prisma.service.findUnique({ where: { id: input.id }, select: { id: true } });
  if (!current) throw new ServiceNotFoundError();
  const status: PublishStatus = input.published ? "PUBLISHED" : "DRAFT";
  const record = await prisma.service.update({ where: { id: input.id }, data: { status }, select: serviceSelect });
  await logActivity({ userId, action: "service.togglePublish", entityType: "Service", entityId: record.id, summary: `${input.published ? "Published" : "Unpublished"} service ${record.title}`, diff: { status } });
  return toView(record);
}
