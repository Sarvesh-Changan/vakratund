import "server-only";

import type { MediaKind, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";
import type { BulkAddGalleryItemsInput, CreateGalleryItemInput, ReorderGalleryItemsInput, UpdateGalleryItemInput } from "@/lib/validation/gallery";
import { logActivity } from "@/server/services/activity";

export type GalleryItemView = {
  id: string;
  mediaId: string;
  category: string;
  title: string | null;
  sortOrder: number;
  isVisible: boolean;
  media: { id: string; kind: MediaKind; url: string; alt: string; width: number | null; height: number | null } | null;
  createdAt: string;
  updatedAt: string;
};

type GalleryRecord = Prisma.GalleryItemGetPayload<{ select: typeof gallerySelect }>;

export class GalleryItemNotFoundError extends Error {
  constructor() {
    super("Gallery item not found.");
    this.name = "GalleryItemNotFoundError";
  }
}

export class GalleryMediaNotFoundError extends Error {
  constructor() {
    super("The selected media asset no longer exists.");
    this.name = "GalleryMediaNotFoundError";
  }
}

const gallerySelect = {
  id: true,
  mediaId: true,
  category: true,
  title: true,
  sortOrder: true,
  isVisible: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.GalleryItemSelect;

function toView(record: GalleryRecord, media: GalleryItemView["media"]): GalleryItemView {
  return { ...record, media, createdAt: record.createdAt.toISOString(), updatedAt: record.updatedAt.toISOString() };
}

async function mediaMap(mediaIds: readonly string[]): Promise<Map<string, GalleryItemView["media"]>> {
  if (mediaIds.length === 0) return new Map();
  const assets = await prisma.mediaAsset.findMany({ where: { id: { in: [...new Set(mediaIds)] } }, select: { id: true, kind: true, url: true, alt: true, width: true, height: true } });
  return new Map(assets.map((asset) => [asset.id, asset]));
}

async function requireMedia(mediaId: string): Promise<void> {
  const asset = await prisma.mediaAsset.findUnique({ where: { id: mediaId }, select: { id: true } });
  if (!asset) throw new GalleryMediaNotFoundError();
}

function galleryData(input: CreateGalleryItemInput | UpdateGalleryItemInput): Prisma.GalleryItemUncheckedCreateInput {
  return { mediaId: input.mediaId, category: input.category, title: input.title?.trim() || null, sortOrder: input.sortOrder, isVisible: input.isVisible };
}

export async function listGalleryItems(filters: { category?: string; visibleOnly?: boolean } = {}): Promise<GalleryItemView[]> {
  const records = await prisma.galleryItem.findMany({
    where: { ...(filters.category ? { category: filters.category } : {}), ...(filters.visibleOnly ? { isVisible: true } : {}) },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: gallerySelect,
  });
  const media = await mediaMap(records.map((record) => record.mediaId));
  return records.map((record) => toView(record, media.get(record.mediaId) ?? null));
}

export async function getGalleryItem(id: string): Promise<GalleryItemView | null> {
  const record = await prisma.galleryItem.findUnique({ where: { id }, select: gallerySelect });
  if (!record) return null;
  const media = await mediaMap([record.mediaId]);
  return toView(record, media.get(record.mediaId) ?? null);
}

export async function createGalleryItem(input: CreateGalleryItemInput, userId: string): Promise<GalleryItemView> {
  await requireMedia(input.mediaId);
  const record = await prisma.galleryItem.create({ data: galleryData(input), select: gallerySelect });
  const media = await mediaMap([record.mediaId]);
  const result = toView(record, media.get(record.mediaId) ?? null);
  await logActivity({ userId, action: "gallery.create", entityType: "GalleryItem", entityId: record.id, summary: `Added ${result.title || result.category} to gallery`, diff: { mediaId: record.mediaId, category: record.category, isVisible: record.isVisible } });
  return result;
}

export async function updateGalleryItem(input: UpdateGalleryItemInput, userId: string): Promise<GalleryItemView> {
  const current = await prisma.galleryItem.findUnique({ where: { id: input.id }, select: { id: true } });
  if (!current) throw new GalleryItemNotFoundError();
  await requireMedia(input.mediaId);
  const record = await prisma.galleryItem.update({ where: { id: input.id }, data: galleryData(input), select: gallerySelect });
  const media = await mediaMap([record.mediaId]);
  const result = toView(record, media.get(record.mediaId) ?? null);
  await logActivity({ userId, action: "gallery.update", entityType: "GalleryItem", entityId: record.id, summary: `Updated ${result.title || result.category} gallery item`, diff: { mediaId: record.mediaId, category: record.category, isVisible: record.isVisible } });
  return result;
}

export async function deleteGalleryItem(id: string, userId: string): Promise<{ deleted: true; id: string }> {
  const current = await prisma.galleryItem.findUnique({ where: { id }, select: { id: true, category: true } });
  if (!current) throw new GalleryItemNotFoundError();
  await prisma.galleryItem.delete({ where: { id } });
  await logActivity({ userId, action: "gallery.delete", entityType: "GalleryItem", entityId: id, summary: `Removed ${current.category} gallery item` });
  return { deleted: true, id };
}

export async function reorderGalleryItems(input: ReorderGalleryItemsInput, userId: string): Promise<GalleryItemView[]> {
  const rows = await prisma.galleryItem.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, category: true, sortOrder: true } });
  const index = rows.findIndex((row) => row.id === input.id);
  const current = rows[index];
  const neighbor = rows[input.direction === "up" ? index - 1 : index + 1];
  if (!current || !neighbor) return listGalleryItems();
  await prisma.$transaction([
    prisma.galleryItem.update({ where: { id: current.id }, data: { sortOrder: neighbor.sortOrder }, select: { id: true } }),
    prisma.galleryItem.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder }, select: { id: true } }),
  ]);
  await logActivity({ userId, action: "gallery.reorder", entityType: "GalleryItem", entityId: current.id, summary: `Moved gallery item ${input.direction}`, diff: { direction: input.direction } });
  return listGalleryItems();
}

export async function bulkAddGalleryItems(input: BulkAddGalleryItemsInput, userId: string): Promise<GalleryItemView[]> {
  const ids = [...new Set(input.mediaIds)];
  const media = await mediaMap(ids);
  if (media.size !== ids.length) throw new GalleryMediaNotFoundError();
  const existing = await prisma.galleryItem.findMany({ where: { mediaId: { in: ids } }, select: { mediaId: true } });
  const existingIds = new Set(existing.map((item) => item.mediaId));
  const highest = await prisma.galleryItem.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  const startOrder = (highest?.sortOrder ?? -1) + 1;
  const rows = ids.filter((id) => !existingIds.has(id)).map((mediaId, index) => ({ mediaId, category: input.category, title: input.title?.trim() || null, sortOrder: startOrder + index, isVisible: input.isVisible }));
  if (rows.length > 0) await prisma.galleryItem.createMany({ data: rows });
  const result = await listGalleryItems();
  await logActivity({ userId, action: "gallery.bulkAdd", entityType: "GalleryItem", summary: `Added ${rows.length} media assets to gallery`, diff: { count: rows.length, category: input.category } });
  return result;
}

