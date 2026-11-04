import "server-only";

import { prisma } from "@/lib/db/client";
import { logActivity } from "@/server/services/activity";
import { deleteMediaAsset, getMediaUsages } from "@/server/services/media";
import { pageSectionSchemas } from "@/lib/validation/pages";
import type { CreateHomeSlideInput, UpdateHomeSlideInput } from "@/lib/validation/home-slides";
import type { z } from "zod";

export type HomeShowcaseSettings = z.infer<typeof pageSectionSchemas.home.showcase>;

export class HomeSlideNotFoundError extends Error {
  constructor() {
    super("Home slide not found.");
    this.name = "HomeSlideNotFoundError";
  }
}

export class HomeSlideAssetNotFoundError extends Error {
  constructor() {
    super("Media asset not found for home slide.");
    this.name = "HomeSlideAssetNotFoundError";
  }
}

export class HomeSlideAssetInvalidError extends Error {
  constructor() {
    super("Slide image must be an IMAGE uploaded to the 'home' section (vakratund/home).");
    this.name = "HomeSlideAssetInvalidError";
  }
}

export type AdminHomeSlideView = {
  id: string;
  mediaId: string;
  alt: string;
  title: string | null;
  caption: string | null;
  linkUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  isPlaceholder: boolean;
  sourceName: string | null;
  sourceUrl: string | null;
  license: string | null;
  createdAt: string;
  updatedAt: string;
  media: {
    id: string;
    url: string;
    alt: string;
    width: number | null;
    height: number | null;
    format: string | null;
    publicId: string;
    folder: string | null;
  };
};

export async function listAdminHomeSlides(): Promise<AdminHomeSlideView[]> {
  const records = await prisma.homeSlide.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      media: {
        select: {
          id: true,
          url: true,
          alt: true,
          width: true,
          height: true,
          format: true,
          publicId: true,
          folder: true,
        },
      },
    },
  });

  return records.map((record) => ({
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }));
}

export async function createHomeSlide(input: CreateHomeSlideInput, userId: string): Promise<AdminHomeSlideView> {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: input.mediaId },
    select: { id: true, kind: true, folder: true, publicId: true },
  });

  if (!asset) {
    throw new HomeSlideAssetNotFoundError();
  }

  if (asset.kind !== "IMAGE" || asset.folder !== "vakratund/home" || !asset.publicId.startsWith("vakratund/home/")) {
    throw new HomeSlideAssetInvalidError();
  }

  let sortOrder = input.sortOrder;
  if (typeof sortOrder !== "number") {
    const max = await prisma.homeSlide.aggregate({ _max: { sortOrder: true } });
    sortOrder = (max._max.sortOrder ?? -1) + 1;
  }

  const record = await prisma.homeSlide.create({
    data: {
      mediaId: input.mediaId,
      alt: input.alt.trim(),
      title: input.title?.trim() || null,
      caption: input.caption?.trim() || null,
      linkUrl: input.linkUrl?.trim() || null,
      isActive: input.isActive ?? true,
      sortOrder,
      isPlaceholder: input.isPlaceholder ?? false,
      sourceName: input.sourceName?.trim() || null,
      sourceUrl: input.sourceUrl?.trim() || null,
      license: input.license?.trim() || null,
    },
    include: {
      media: {
        select: {
          id: true,
          url: true,
          alt: true,
          width: true,
          height: true,
          format: true,
          publicId: true,
          folder: true,
        },
      },
    },
  });

  await logActivity({
    userId,
    action: "home_slide.create",
    entityType: "HomeSlide",
    entityId: record.id,
    summary: `Home slide added: ${record.title || record.alt}`,
    diff: { alt: record.alt, sortOrder: record.sortOrder, isPlaceholder: record.isPlaceholder },
  });

  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function updateHomeSlide(input: UpdateHomeSlideInput, userId: string): Promise<AdminHomeSlideView> {
  const existing = await prisma.homeSlide.findUnique({ where: { id: input.id } });
  if (!existing) throw new HomeSlideNotFoundError();

  if (input.mediaId && input.mediaId !== existing.mediaId) {
    const asset = await prisma.mediaAsset.findUnique({
      where: { id: input.mediaId },
      select: { id: true, kind: true, folder: true, publicId: true },
    });
    if (!asset) {
      throw new HomeSlideAssetNotFoundError();
    }
    if (asset.kind !== "IMAGE" || asset.folder !== "vakratund/home" || !asset.publicId.startsWith("vakratund/home/")) {
      throw new HomeSlideAssetInvalidError();
    }
  }

  const record = await prisma.homeSlide.update({
    where: { id: input.id },
    data: {
      ...(input.mediaId ? { mediaId: input.mediaId } : {}),
      alt: input.alt.trim(),
      title: input.title?.trim() || null,
      caption: input.caption?.trim() || null,
      linkUrl: input.linkUrl?.trim() || null,
      isActive: input.isActive,
      ...(typeof input.sortOrder === "number" ? { sortOrder: input.sortOrder } : {}),
    },
    include: {
      media: {
        select: {
          id: true,
          url: true,
          alt: true,
          width: true,
          height: true,
          format: true,
          publicId: true,
          folder: true,
        },
      },
    },
  });

  await logActivity({
    userId,
    action: "home_slide.update",
    entityType: "HomeSlide",
    entityId: record.id,
    summary: `Home slide updated: ${record.title || record.alt}`,
    diff: { alt: record.alt, isActive: record.isActive },
  });

  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function deleteHomeSlide(
  id: string,
  deleteCloudinaryAsset: boolean,
  userId: string,
): Promise<{ deleted: true; cloudinaryDeleted: boolean }> {
  const slide = await prisma.homeSlide.findUnique({ where: { id } });
  if (!slide) throw new HomeSlideNotFoundError();

  const mediaId = slide.mediaId;
  await prisma.homeSlide.delete({ where: { id } });

  let cloudinaryDeleted = false;
  if (deleteCloudinaryAsset) {
    try {
      const usages = await getMediaUsages(mediaId);
      if (usages.length === 0) {
        await deleteMediaAsset(mediaId, userId);
        cloudinaryDeleted = true;
      }
    } catch (error) {
      console.warn("Best-effort Cloudinary deletion skipped or failed", { error });
    }
  }

  await logActivity({
    userId,
    action: "home_slide.delete",
    entityType: "HomeSlide",
    entityId: id,
    summary: `Home slide deleted (${slide.alt})`,
    diff: { mediaId, cloudinaryDeleted },
  });

  return { deleted: true, cloudinaryDeleted };
}

export async function toggleHomeSlideActive(id: string, isActive: boolean, userId: string): Promise<AdminHomeSlideView> {
  const existing = await prisma.homeSlide.findUnique({ where: { id } });
  if (!existing) throw new HomeSlideNotFoundError();

  const record = await prisma.homeSlide.update({
    where: { id },
    data: { isActive },
    include: {
      media: {
        select: {
          id: true,
          url: true,
          alt: true,
          width: true,
          height: true,
          format: true,
          publicId: true,
          folder: true,
        },
      },
    },
  });

  await logActivity({
    userId,
    action: "home_slide.toggle_active",
    entityType: "HomeSlide",
    entityId: id,
    summary: `Home slide active toggled: ${isActive}`,
    diff: { isActive },
  });

  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function reorderHomeSlide(id: string, direction: "up" | "down", userId: string): Promise<void> {
  const current = await prisma.homeSlide.findUnique({ where: { id } });
  if (!current) throw new HomeSlideNotFoundError();

  const adjacent = await prisma.homeSlide.findFirst({
    where: {
      sortOrder: direction === "up" ? { lt: current.sortOrder } : { gt: current.sortOrder },
    },
    orderBy: {
      sortOrder: direction === "up" ? "desc" : "asc",
    },
  });

  if (!adjacent) return;

  await prisma.$transaction([
    prisma.homeSlide.update({ where: { id: current.id }, data: { sortOrder: adjacent.sortOrder } }),
    prisma.homeSlide.update({ where: { id: adjacent.id }, data: { sortOrder: current.sortOrder } }),
  ]);

  await logActivity({
    userId,
    action: "home_slide.reorder",
    entityType: "HomeSlide",
    entityId: id,
    summary: `Home slide order changed (${direction})`,
    diff: { previousOrder: current.sortOrder, newOrder: adjacent.sortOrder },
  });
}

export async function setHomeSlideOrder(orderedIds: string[], userId: string): Promise<void> {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.homeSlide.update({
        where: { id },
        data: { sortOrder: index },
      }),
    ),
  );

  await logActivity({
    userId,
    action: "home_slide.reorder_batch",
    entityType: "HomeSlide",
    entityId: "bulk",
    summary: "Home slides reordered via drag-and-drop",
    diff: { count: orderedIds.length },
  });
}

export async function getHomeShowcaseSettings(): Promise<HomeShowcaseSettings> {
  const row = await prisma.pageSection.findUnique({
    where: { pageKey_sectionKey: { pageKey: "home", sectionKey: "showcase" } },
  });

  const parsed = row ? pageSectionSchemas.home.showcase.safeParse(row.content) : null;
  return parsed?.success ? parsed.data : { eyebrow: "", heading: "", speed: "normal", pauseOnHover: true };
}

export async function updateHomeShowcaseSettings(input: HomeShowcaseSettings, userId: string): Promise<HomeShowcaseSettings> {
  await prisma.pageSection.upsert({
    where: { pageKey_sectionKey: { pageKey: "home", sectionKey: "showcase" } },
    create: {
      pageKey: "home",
      sectionKey: "showcase",
      content: input,
      isVisible: true,
    },
    update: {
      content: input,
      isVisible: true,
    },
  });

  await logActivity({
    userId,
    action: "home_showcase.update_settings",
    entityType: "PageSection",
    entityId: "home:showcase",
    summary: "Home slider showcase settings updated",
    diff: input,
  });

  return input;
}

export async function getSamplePhotosCount(): Promise<number> {
  return prisma.homeSlide.count({
    where: { isPlaceholder: true, isActive: true },
  });
}

