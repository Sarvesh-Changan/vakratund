import "server-only";

import type { MediaKind, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";
import { destroyCloudinaryAsset } from "@/lib/cloudinary/signature";
import { cloudinaryFolder, normalizeUploadFolder } from "@/lib/cloudinary/policy";
import { env } from "@/lib/env";
import { logActivity } from "@/server/services/activity";
import type { z } from "zod";
import type { createSaveMediaAssetSchema } from "@/lib/validation/media";

export type SaveMediaAssetInput = z.infer<ReturnType<typeof createSaveMediaAssetSchema>>;

export type MediaUsage = {
  type: string;
  label: string;
  href?: string;
};

export type MediaAssetView = {
  id: string;
  kind: MediaKind;
  publicId: string;
  url: string;
  format: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  alt: string;
  caption: string | null;
  folder: string | null;
  createdAt: string;
  usageCount: number;
  usages: MediaUsage[];
};

type MediaRecord = {
  id: string;
  kind: MediaKind;
  publicId: string;
  url: string;
  format: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  alt: string;
  caption: string | null;
  folder: string | null;
  createdAt: Date;
};

function addUsage(map: Map<string, MediaUsage[]>, mediaId: string, usage: MediaUsage): void {
  const current = map.get(mediaId) ?? [];
  current.push(usage);
  map.set(mediaId, current);
}

async function usageMap(mediaIds: readonly string[]): Promise<Map<string, MediaUsage[]>> {
  const result = new Map<string, MediaUsage[]>();
  if (mediaIds.length === 0) return result;
  const [projectMedia, galleries, services, teams, posts, pageSeo, settings] = await Promise.all([
    prisma.projectMedia.findMany({ where: { mediaId: { in: [...mediaIds] } }, select: { mediaId: true, projectId: true } }),
    prisma.galleryItem.findMany({ where: { mediaId: { in: [...mediaIds] } }, select: { mediaId: true, title: true, category: true } }),
    prisma.service.findMany({ where: { coverId: { in: [...mediaIds] } }, select: { coverId: true, title: true, slug: true } }),
    prisma.teamMember.findMany({ where: { photoId: { in: [...mediaIds] } }, select: { photoId: true, name: true } }),
    prisma.blogPost.findMany({ where: { coverId: { in: [...mediaIds] } }, select: { coverId: true, title: true, slug: true } }),
    prisma.pageSeo.findMany({ where: { ogImageId: { in: [...mediaIds] } }, select: { ogImageId: true, path: true } }),
    prisma.siteSetting.findMany({ where: { brochureMediaId: { in: [...mediaIds] } }, select: { brochureMediaId: true } }),
  ]);

  const projectIds = [...new Set(projectMedia.map((row) => row.projectId))];
  const projects = await prisma.project.findMany({ where: { id: { in: projectIds } }, select: { id: true, title: true, slug: true } });
  const projectById = new Map(projects.map((project) => [project.id, project]));
  for (const row of projectMedia) {
    const project = projectById.get(row.projectId);
    if (project) addUsage(result, row.mediaId, { type: "Project", label: project.title, href: `/admin/projects/${project.slug}` });
  }
  for (const row of galleries) addUsage(result, row.mediaId, { type: "Gallery", label: row.title || row.category });
  for (const row of services) if (row.coverId) addUsage(result, row.coverId, { type: "Service", label: row.title, href: `/admin/services/${row.slug}` });
  for (const row of teams) if (row.photoId) addUsage(result, row.photoId, { type: "Team", label: row.name });
  for (const row of posts) if (row.coverId) addUsage(result, row.coverId, { type: "Blog", label: row.title, href: `/admin/blog/${row.slug}` });
  for (const row of pageSeo) if (row.ogImageId) addUsage(result, row.ogImageId, { type: "SEO", label: row.path, href: `/admin/seo` });
  for (const row of settings) if (row.brochureMediaId) addUsage(result, row.brochureMediaId, { type: "Settings", label: "Company profile brochure", href: `/admin/settings` });
  return result;
}

function toView(record: MediaRecord, usages: MediaUsage[]): MediaAssetView {
  return { ...record, createdAt: record.createdAt.toISOString(), usageCount: usages.length, usages };
}

export async function listMediaAssets(filters: { q?: string; folder?: string } = {}): Promise<MediaAssetView[]> {
  const q = filters.q?.trim();
  const where: Prisma.MediaAssetWhereInput = {
    ...(filters.folder ? { folder: filters.folder } : {}),
    ...(q ? { OR: [{ publicId: { contains: q, mode: "insensitive" } }, { alt: { contains: q, mode: "insensitive" } }, { caption: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const records = await prisma.mediaAsset.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, kind: true, publicId: true, url: true, format: true, width: true, height: true, bytes: true, alt: true, caption: true, folder: true, createdAt: true },
  });
  const usages = await usageMap(records.map((record) => record.id));
  return records.map((record) => toView(record, usages.get(record.id) ?? []));
}

export async function createMediaAsset(input: SaveMediaAssetInput, userId: string): Promise<MediaAssetView> {
  const folder = normalizeUploadFolder(input.folder);
  if (!folder) throw new Error("Media folder is not allowed.");
  const record = await prisma.mediaAsset.create({
    data: { ...input, folder: cloudinaryFolder(folder), uploadedBy: userId, caption: input.caption ?? null },
    select: { id: true, kind: true, publicId: true, url: true, format: true, width: true, height: true, bytes: true, alt: true, caption: true, folder: true, createdAt: true },
  });
  await logActivity({ userId, action: "media.create", entityType: "MediaAsset", entityId: record.id, summary: "Media asset uploaded", diff: { kind: record.kind, format: record.format, folder: record.folder } });
  return toView(record, []);
}

export async function updateMediaAsset(input: { id: string; alt: string; caption?: string }, userId: string): Promise<MediaAssetView> {
  const record = await prisma.mediaAsset.update({
    where: { id: input.id },
    data: { alt: input.alt, caption: input.caption ?? null },
    select: { id: true, kind: true, publicId: true, url: true, format: true, width: true, height: true, bytes: true, alt: true, caption: true, folder: true, createdAt: true },
  });
  const usages = (await usageMap([record.id])).get(record.id) ?? [];
  await logActivity({ userId, action: "media.update", entityType: "MediaAsset", entityId: record.id, summary: "Media metadata updated", diff: { altChanged: true, captionChanged: true } });
  return toView(record, usages);
}

export async function getMediaUsages(id: string): Promise<MediaUsage[]> {
  return (await usageMap([id])).get(id) ?? [];
}

export async function deleteMediaAsset(id: string, userId: string): Promise<{ deleted: true }> {
  const record = await prisma.mediaAsset.findUnique({ where: { id }, select: { id: true, publicId: true, kind: true } });
  if (!record) throw new Error("Media asset not found.");
  const usages = await getMediaUsages(id);
  if (usages.length > 0) throw new MediaAssetInUseError(usages);

  await destroyCloudinaryAsset(record.publicId, record.kind);
  await prisma.mediaAsset.delete({ where: { id } });
  await logActivity({ userId, action: "media.delete", entityType: "MediaAsset", entityId: id, summary: "Media asset deleted", diff: { publicId: record.publicId } });
  return { deleted: true };
}

export class MediaAssetInUseError extends Error {
  readonly usages: MediaUsage[];

  constructor(usages: MediaUsage[]) {
    super("This media asset is still referenced.");
    this.name = "MediaAssetInUseError";
    this.usages = usages;
  }
}

export function configuredCloudName(): string {
  return env.CLOUDINARY_CLOUD_NAME?.trim() ?? "";
}
