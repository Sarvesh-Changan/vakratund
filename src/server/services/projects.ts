import "server-only";

import type { MediaKind, Prisma, ProjectStatus, PublishStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";
import { slugify } from "@/lib/utils";
import type { CreateProjectInput, ReorderProjectsInput, TogglePublishProjectInput, UpdateProjectInput } from "@/lib/validation/projects";
import { logActivity } from "@/server/services/activity";

export type ProjectMediaView = {
  id: string;
  mediaId: string;
  isCover: boolean;
  isBefore: boolean;
  isAfter: boolean;
  sortOrder: number;
  media: { id: string; kind: MediaKind; url: string; alt: string; width: number | null; height: number | null };
};

export type ProjectView = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string | null;
  serviceId: string | null;
  service: { id: string; title: string; slug: string } | null;
  clientName: string | null;
  showClientName: boolean;
  locationText: string | null;
  areaSqft: number | null;
  floorsText: string | null;
  scopeText: string | null;
  year: number | null;
  status: ProjectStatus;
  progressPct: number | null;
  isFeatured: boolean;
  publishStatus: PublishStatus;
  sortOrder: number;
  seoTitle: string | null;
  seoDesc: string | null;
  media: ProjectMediaView[];
  createdAt: string;
  updatedAt: string;
};

type ProjectRecord = Prisma.ProjectGetPayload<{ select: typeof projectSelect }>;

export class ProjectSlugConflictError extends Error {
  constructor() {
    super("That slug is already in use.");
    this.name = "ProjectSlugConflictError";
  }
}

export class ProjectNotFoundError extends Error {
  constructor() {
    super("Project not found.");
    this.name = "ProjectNotFoundError";
  }
}

export class ProjectSlugInvalidError extends Error {
  constructor() {
    super("The title must produce a valid slug.");
    this.name = "ProjectSlugInvalidError";
  }
}

export class ProjectPublishValidationError extends Error {
  readonly fieldErrors: Record<string, string[]>;

  constructor(fieldErrors: Record<string, string[]>) {
    super("This project cannot be published until the required fields are complete.");
    this.name = "ProjectPublishValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export class ProjectServiceNotFoundError extends Error {
  constructor() {
    super("The selected service no longer exists.");
    this.name = "ProjectServiceNotFoundError";
  }
}

const projectSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  description: true,
  serviceId: true,
  service: { select: { id: true, title: true, slug: true } },
  clientName: true,
  showClientName: true,
  locationText: true,
  areaSqft: true,
  floorsText: true,
  scopeText: true,
  year: true,
  status: true,
  progressPct: true,
  isFeatured: true,
  publishStatus: true,
  sortOrder: true,
  seoTitle: true,
  seoDesc: true,
  media: {
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      mediaId: true,
      isCover: true,
      isBefore: true,
      isAfter: true,
      sortOrder: true,
      media: { select: { id: true, kind: true, url: true, alt: true, width: true, height: true } },
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

function toView(record: ProjectRecord): ProjectView {
  return {
    ...record,
    media: record.media,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function nullableString(value: string | undefined): string | null {
  return value?.trim() ? value.trim() : null;
}

function projectData(input: CreateProjectInput | UpdateProjectInput, slug: string): Prisma.ProjectUncheckedCreateInput {
  return {
    title: input.title,
    slug,
    summary: input.summary,
    description: nullableString(input.description),
    serviceId: input.serviceId,
    clientName: nullableString(input.clientName),
    showClientName: input.showClientName,
    locationText: nullableString(input.locationText),
    areaSqft: input.areaSqft,
    floorsText: nullableString(input.floorsText),
    scopeText: nullableString(input.scopeText),
    year: input.year,
    status: input.status,
    progressPct: input.progressPct,
    isFeatured: input.isFeatured,
    publishStatus: input.publishStatus,
    sortOrder: input.sortOrder,
    seoTitle: nullableString(input.seoTitle),
    seoDesc: nullableString(input.seoDesc),
  };
}

export function projectPublishFieldErrors(input: { title: string; slug?: string; summary: string }, mediaKinds: readonly MediaKind[]): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  if (!input.title.trim()) errors.title = ["Title is required before publishing."];
  if (!input.slug?.trim()) errors.slug = ["A valid slug is required before publishing."];
  if (!input.summary.trim()) errors.summary = ["Summary is required before publishing."];
  if (!mediaKinds.includes("IMAGE")) errors.media = ["Add at least one image before publishing."];
  return errors;
}

async function uniqueSlug(input: CreateProjectInput | UpdateProjectInput, excludeId?: string): Promise<string> {
  const candidate = slugify(input.slug || input.title);
  if (!candidate) throw new ProjectSlugInvalidError();
  const existing = await prisma.project.findFirst({ where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } });
  if (existing) throw new ProjectSlugConflictError();
  return candidate;
}

async function validateRelations(input: CreateProjectInput | UpdateProjectInput): Promise<MediaKind[]> {
  if (input.serviceId) {
    const service = await prisma.service.findUnique({ where: { id: input.serviceId }, select: { id: true } });
    if (!service) throw new ProjectServiceNotFoundError();
  }

  const mediaIds = [...new Set(input.media.map((item) => item.mediaId))];
  if (mediaIds.length === 0) return [];
  const media = await prisma.mediaAsset.findMany({ where: { id: { in: mediaIds } }, select: { id: true, kind: true } });
  if (media.length !== mediaIds.length) throw new ProjectPublishValidationError({ media: ["One or more selected media assets no longer exist."] });
  return media.map((item) => item.kind);
}

function mediaData(input: CreateProjectInput | UpdateProjectInput): Prisma.ProjectMediaCreateManyProjectInput[] {
  return input.media.map((item) => ({ ...item }));
}

async function assertPublishable(input: CreateProjectInput | UpdateProjectInput, mediaKinds: readonly MediaKind[]): Promise<void> {
  if (input.publishStatus !== "PUBLISHED") return;
  const errors = projectPublishFieldErrors(input, mediaKinds);
  if (Object.keys(errors).length > 0) throw new ProjectPublishValidationError(errors);
}

export async function listProjects(filters: { q?: string; publishStatus?: PublishStatus; status?: ProjectStatus } = {}): Promise<ProjectView[]> {
  const q = filters.q?.trim();
  const records = await prisma.project.findMany({
    where: {
      ...(filters.publishStatus ? { publishStatus: filters.publishStatus } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }, { locationText: { contains: q, mode: "insensitive" } }] } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: projectSelect,
  });
  return records.map((record) => toView(record));
}

export async function getProject(id: string): Promise<ProjectView | null> {
  const record = await prisma.project.findUnique({ where: { id }, select: projectSelect });
  return record ? toView(record) : null;
}

/** Creates a project, validates media references and records the mutation. */
export async function createProject(input: CreateProjectInput, userId: string): Promise<ProjectView> {
  const projectSlug = await uniqueSlug(input);
  const mediaKinds = await validateRelations(input);
  await assertPublishable(input, mediaKinds);
  const recordId = await prisma.$transaction(async (tx) => {
    const record = await tx.project.create({ data: projectData(input, projectSlug), select: { id: true } });
    if (input.media.length > 0) await tx.projectMedia.createMany({ data: mediaData(input).map((item) => ({ ...item, projectId: record.id })) });
    return record.id;
  });
  const record = await getProject(recordId);
  if (!record) throw new ProjectNotFoundError();
  await logActivity({ userId, action: "project.create", entityType: "Project", entityId: record.id, summary: `Created project ${record.title}`, diff: { slug: record.slug, publishStatus: record.publishStatus, mediaCount: record.media.length } });
  return record;
}

/** Updates a project and replaces its ordered media set atomically. */
export async function updateProject(input: UpdateProjectInput, userId: string): Promise<ProjectView> {
  const current = await prisma.project.findUnique({ where: { id: input.id }, select: { id: true, title: true } });
  if (!current) throw new ProjectNotFoundError();
  const projectSlug = await uniqueSlug(input, input.id);
  const mediaKinds = await validateRelations(input);
  await assertPublishable(input, mediaKinds);
  await prisma.$transaction(async (tx) => {
    await tx.project.update({ where: { id: input.id }, data: projectData(input, projectSlug), select: { id: true } });
    await tx.projectMedia.deleteMany({ where: { projectId: input.id } });
    if (input.media.length > 0) await tx.projectMedia.createMany({ data: mediaData(input).map((item) => ({ ...item, projectId: input.id })) });
  });
  const record = await getProject(input.id);
  if (!record) throw new ProjectNotFoundError();
  await logActivity({ userId, action: "project.update", entityType: "Project", entityId: record.id, summary: `Updated project ${record.title}`, diff: { slug: record.slug, publishStatus: record.publishStatus, mediaCount: record.media.length } });
  return record;
}

export async function deleteProject(id: string, userId: string): Promise<{ deleted: true; id: string }> {
  const record = await prisma.project.findUnique({ where: { id }, select: { id: true, title: true, slug: true } });
  if (!record) throw new ProjectNotFoundError();
  await prisma.project.delete({ where: { id } });
  await logActivity({ userId, action: "project.delete", entityType: "Project", entityId: id, summary: `Deleted project ${record.title}`, diff: { slug: record.slug } });
  return { deleted: true, id };
}

export async function reorderProjects(input: ReorderProjectsInput, userId: string): Promise<ProjectView[]> {
  const rows = await prisma.project.findMany({ orderBy: [{ sortOrder: "asc" }, { title: "asc" }], select: { id: true, title: true, sortOrder: true } });
  const index = rows.findIndex((row) => row.id === input.id);
  const current = rows[index];
  const neighbor = rows[input.direction === "up" ? index - 1 : index + 1];
  if (!current || !neighbor) return listProjects();
  await prisma.$transaction([
    prisma.project.update({ where: { id: current.id }, data: { sortOrder: neighbor.sortOrder }, select: { id: true } }),
    prisma.project.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder }, select: { id: true } }),
  ]);
  await logActivity({ userId, action: "project.reorder", entityType: "Project", entityId: current.id, summary: `Moved project ${input.direction}`, diff: { direction: input.direction } });
  return listProjects();
}

export async function togglePublishProject(input: TogglePublishProjectInput, userId: string): Promise<ProjectView> {
  const current = await getProject(input.id);
  if (!current) throw new ProjectNotFoundError();
  if (input.published) {
    const mediaKinds = current.media.map((item) => item.media.kind);
    const errors = projectPublishFieldErrors(current, mediaKinds);
    if (Object.keys(errors).length > 0) throw new ProjectPublishValidationError(errors);
  }
  await prisma.project.update({ where: { id: input.id }, data: { publishStatus: input.published ? "PUBLISHED" : "DRAFT" }, select: { id: true } });
  const record = await getProject(input.id);
  if (!record) throw new ProjectNotFoundError();
  await logActivity({ userId, action: "project.togglePublish", entityType: "Project", entityId: record.id, summary: `${input.published ? "Published" : "Unpublished"} project ${record.title}`, diff: { publishStatus: record.publishStatus } });
  return record;
}

