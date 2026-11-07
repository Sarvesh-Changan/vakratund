import "server-only";

import type { MediaKind, Prisma, PublishStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";
import type { CreateTestimonialInput, ReorderTestimonialsInput, TogglePublishTestimonialInput, UpdateTestimonialInput } from "@/lib/validation/testimonials";
import { logActivity } from "@/server/services/activity";

// ─── Types ───────────────────────────────────────────────────────────────────

export type TestimonialMediaItem = {
  id: string;
  mediaId: string;
  sortOrder: number;
  thumbnailId: string | null;
  media: { id: string; kind: MediaKind; url: string; alt: string; width: number | null; height: number | null };
  thumbnail: { id: string; url: string; alt: string } | null;
};

export type TestimonialView = {
  id: string;
  name: string;
  roleOrOrg: string | null;
  quote: string;
  rating: number | null;
  projectId: string | null;
  project: { id: string; title: string; slug: string } | null;
  photoId: string | null;
  photo: { id: string; kind: MediaKind; url: string; alt: string; width: number | null; height: number | null } | null;
  media: TestimonialMediaItem[];
  status: PublishStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

// ─── Errors ──────────────────────────────────────────────────────────────────

export class TestimonialNotFoundError extends Error {
  constructor() { super("Testimonial not found."); this.name = "TestimonialNotFoundError"; }
}
export class TestimonialProjectNotFoundError extends Error {
  constructor() { super("The selected project no longer exists."); this.name = "TestimonialProjectNotFoundError"; }
}
export class TestimonialPhotoNotFoundError extends Error {
  constructor() { super("The selected testimonial photo no longer exists."); this.name = "TestimonialPhotoNotFoundError"; }
}
export class TestimonialPhotoMustBeImageError extends Error {
  constructor() { super("Testimonial photos must be image media."); this.name = "TestimonialPhotoMustBeImageError"; }
}
export class TestimonialMediaNotFoundError extends Error {
  constructor(id: string) { super(`Media asset ${id} not found.`); this.name = "TestimonialMediaNotFoundError"; }
}
export class TestimonialThumbnailNotFoundError extends Error {
  constructor(id: string) { super(`Thumbnail asset ${id} not found.`); this.name = "TestimonialThumbnailNotFoundError"; }
}
export class TestimonialThumbnailMustBeImageError extends Error {
  constructor() { super("Thumbnails must be image media."); this.name = "TestimonialThumbnailMustBeImageError"; }
}

// ─── Selects ─────────────────────────────────────────────────────────────────

const testimonialMediaSelect = {
  id: true,
  mediaId: true,
  sortOrder: true,
  thumbnailId: true,
  media: { select: { id: true, kind: true, url: true, alt: true, width: true, height: true } },
  thumbnail: { select: { id: true, url: true, alt: true } },
} satisfies Prisma.TestimonialMediaSelect;

const testimonialSelect = {
  id: true,
  name: true,
  roleOrOrg: true,
  quote: true,
  rating: true,
  projectId: true,
  project: { select: { id: true, title: true, slug: true } },
  photoId: true,
  photo: { select: { id: true, kind: true, url: true, alt: true, width: true, height: true } },
  media: { select: testimonialMediaSelect, orderBy: { sortOrder: "asc" as const } },
  status: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TestimonialSelect;

type TestimonialRecord = Prisma.TestimonialGetPayload<{ select: typeof testimonialSelect }>;

function toView(record: TestimonialRecord): TestimonialView {
  return { ...record, createdAt: record.createdAt.toISOString(), updatedAt: record.updatedAt.toISOString() };
}

function nullableString(value: string | undefined): string | null { return value?.trim() ? value.trim() : null; }

// ─── Validators ───────────────────────────────────────────────────────────────

async function validateProject(projectId: string | null): Promise<void> {
  if (!projectId) return;
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) throw new TestimonialProjectNotFoundError();
}

async function validatePhoto(photoId: string | null): Promise<void> {
  if (!photoId) return;
  const photo = await prisma.mediaAsset.findUnique({ where: { id: photoId }, select: { id: true, kind: true } });
  if (!photo) throw new TestimonialPhotoNotFoundError();
  if (photo.kind !== "IMAGE") throw new TestimonialPhotoMustBeImageError();
}

async function validateMediaIds(mediaIds: string[]): Promise<void> {
  for (const id of mediaIds) {
    const asset = await prisma.mediaAsset.findUnique({ where: { id }, select: { id: true, kind: true } });
    if (!asset) throw new TestimonialMediaNotFoundError(id);
  }
}

async function validateThumbnailIds(thumbnailIds: Record<string, string>): Promise<void> {
  for (const thumbId of Object.values(thumbnailIds)) {
    const asset = await prisma.mediaAsset.findUnique({ where: { id: thumbId }, select: { id: true, kind: true } });
    if (!asset) throw new TestimonialThumbnailNotFoundError(thumbId);
    if (asset.kind !== "IMAGE") throw new TestimonialThumbnailMustBeImageError();
  }
}

function inputData(input: CreateTestimonialInput | UpdateTestimonialInput): Prisma.TestimonialUncheckedCreateInput {
  return {
    name: input.name,
    roleOrOrg: nullableString(input.roleOrOrg),
    quote: input.quote,
    rating: input.rating,
    projectId: input.projectId,
    photoId: input.photoId,
    status: input.status,
    sortOrder: input.sortOrder,
  };
}

/** Sync the TestimonialMedia join rows for a testimonial */
async function syncMedia(testimonialId: string, mediaIds: string[], thumbnailIds: Record<string, string>): Promise<void> {
  // Delete removed
  await prisma.testimonialMedia.deleteMany({
    where: { testimonialId, ...( mediaIds.length > 0 ? { mediaId: { notIn: mediaIds } } : {}) },
  });
  if (mediaIds.length === 0) {
    await prisma.testimonialMedia.deleteMany({ where: { testimonialId } });
    return;
  }
  // Upsert each in order
  for (let i = 0; i < mediaIds.length; i++) {
    const mediaId = mediaIds[i]!;
    const thumbnailId = thumbnailIds[mediaId] ?? null;
    await prisma.testimonialMedia.upsert({
      where: { testimonialId_mediaId: { testimonialId, mediaId } },
      create: { testimonialId, mediaId, thumbnailId, sortOrder: i },
      update: { thumbnailId, sortOrder: i },
    });
  }
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function listTestimonials(filters: { q?: string; status?: PublishStatus } = {}): Promise<TestimonialView[]> {
  const q = filters.q?.trim();
  const rows = await prisma.testimonial.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { roleOrOrg: { contains: q, mode: "insensitive" } }, { quote: { contains: q, mode: "insensitive" } }] } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: testimonialSelect,
  });
  return rows.map(toView);
}

export async function getTestimonial(id: string): Promise<TestimonialView | null> {
  const row = await prisma.testimonial.findUnique({ where: { id }, select: testimonialSelect });
  return row ? toView(row) : null;
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createTestimonial(input: CreateTestimonialInput, userId: string): Promise<TestimonialView> {
  await validateProject(input.projectId);
  await validatePhoto(input.photoId);
  await validateMediaIds(input.mediaIds);
  await validateThumbnailIds(input.thumbnailIds);
  const row = await prisma.testimonial.create({ data: inputData(input), select: testimonialSelect });
  await syncMedia(row.id, input.mediaIds, input.thumbnailIds);
  const updated = await prisma.testimonial.findUniqueOrThrow({ where: { id: row.id }, select: testimonialSelect });
  await logActivity({ userId, action: "testimonial.create", entityType: "Testimonial", entityId: row.id, summary: `Created testimonial from ${row.name}`, diff: { status: row.status, rating: row.rating, projectId: row.projectId, mediaCount: input.mediaIds.length } });
  return toView(updated);
}

export async function updateTestimonial(input: UpdateTestimonialInput, userId: string): Promise<TestimonialView> {
  const current = await prisma.testimonial.findUnique({ where: { id: input.id }, select: { id: true } });
  if (!current) throw new TestimonialNotFoundError();
  await validateProject(input.projectId);
  await validatePhoto(input.photoId);
  await validateMediaIds(input.mediaIds);
  await validateThumbnailIds(input.thumbnailIds);
  const row = await prisma.testimonial.update({ where: { id: input.id }, data: inputData(input), select: testimonialSelect });
  await syncMedia(row.id, input.mediaIds, input.thumbnailIds);
  const updated = await prisma.testimonial.findUniqueOrThrow({ where: { id: row.id }, select: testimonialSelect });
  await logActivity({ userId, action: "testimonial.update", entityType: "Testimonial", entityId: row.id, summary: `Updated testimonial from ${row.name}`, diff: { status: row.status, rating: row.rating, projectId: row.projectId, mediaCount: input.mediaIds.length } });
  return toView(updated);
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
