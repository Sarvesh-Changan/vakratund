import { beforeEach, describe, expect, it, vi } from "vitest";

const homeSlideFindMany = vi.hoisted(() => vi.fn());
const homeSlideFindFirst = vi.hoisted(() => vi.fn());
const homeSlideFindUnique = vi.hoisted(() => vi.fn());
const homeSlideCreate = vi.hoisted(() => vi.fn());
const homeSlideUpdate = vi.hoisted(() => vi.fn());
const homeSlideDelete = vi.hoisted(() => vi.fn());
const homeSlideCount = vi.hoisted(() => vi.fn());
const mediaAssetFindUnique = vi.hoisted(() => vi.fn());
const pageSectionFindUnique = vi.hoisted(() => vi.fn());
const pageSectionUpsert = vi.hoisted(() => vi.fn());
const transaction = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({
  prisma: {
    homeSlide: {
      findMany: homeSlideFindMany,
      findFirst: homeSlideFindFirst,
      findUnique: homeSlideFindUnique,
      create: homeSlideCreate,
      update: homeSlideUpdate,
      delete: homeSlideDelete,
      count: homeSlideCount,
    },
    mediaAsset: {
      findUnique: mediaAssetFindUnique,
    },
    pageSection: {
      findUnique: pageSectionFindUnique,
      upsert: pageSectionUpsert,
    },
    $transaction: transaction,
  },
}));

vi.mock("@/server/services/activity", () => ({ logActivity: vi.fn() }));
vi.mock("@/server/services/media", () => ({ deleteMediaAsset: vi.fn() }));

import {
  createHomeSlide,
  deleteHomeSlide,
  getHomeShowcaseSettings,
  getSamplePhotosCount,
  HomeSlideAssetInvalidError,
  HomeSlideAssetNotFoundError,
  HomeSlideNotFoundError,
  listAdminHomeSlides,
  reorderHomeSlide,
  setHomeSlideOrder,
  toggleHomeSlideActive,
  updateHomeShowcaseSettings,
  updateHomeSlide,
} from "@/server/services/home-slides";

describe("home-slides services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createHomeSlide", () => {
    it("throws HomeSlideAssetNotFoundError if mediaId does not exist", async () => {
      mediaAssetFindUnique.mockResolvedValue(null);

      await expect(
        createHomeSlide(
          {
            mediaId: "nonexistent",
            alt: "A construction crane",
            isActive: true,
            isPlaceholder: false,
          },
          "user-1",
        ),
      ).rejects.toBeInstanceOf(HomeSlideAssetNotFoundError);
    });

    it("throws HomeSlideAssetInvalidError if asset is not in vakratund/home folder", async () => {
      mediaAssetFindUnique.mockResolvedValue({
        id: "media-1",
        publicId: "vakratund/projects/proj-1",
        kind: "IMAGE",
      });

      await expect(
        createHomeSlide(
          {
            mediaId: "media-1",
            alt: "A construction crane",
            isActive: true,
            isPlaceholder: false,
          },
          "user-1",
        ),
      ).rejects.toBeInstanceOf(HomeSlideAssetInvalidError);
    });

    it("throws HomeSlideAssetInvalidError if asset is not kind IMAGE", async () => {
      mediaAssetFindUnique.mockResolvedValue({
        id: "media-1",
        publicId: "vakratund/home/doc-1",
        kind: "DOCUMENT",
      });

      await expect(
        createHomeSlide(
          {
            mediaId: "media-1",
            alt: "A construction crane",
            isActive: true,
            isPlaceholder: false,
          },
          "user-1",
        ),
      ).rejects.toBeInstanceOf(HomeSlideAssetInvalidError);
    });

    it("creates slide with auto-incremented sortOrder at the end", async () => {
      mediaAssetFindUnique.mockResolvedValue({
        id: "media-1",
        publicId: "vakratund/home/crane-1",
        kind: "IMAGE",
      });
      homeSlideFindFirst.mockResolvedValue({ sortOrder: 5 });
      homeSlideCreate.mockResolvedValue({
        id: "slide-1",
        mediaId: "media-1",
        alt: "A construction crane",
        sortOrder: 6,
        isActive: true,
      });

      const slide = await createHomeSlide(
        {
          mediaId: "media-1",
          alt: "A construction crane",
          title: "Crane lifting rebar",
          isActive: true,
          isPlaceholder: false,
        },
        "user-1",
      );

      expect(homeSlideCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            mediaId: "media-1",
            alt: "A construction crane",
            sortOrder: 6,
            isActive: true,
          }),
        }),
      );
      expect(slide.id).toBe("slide-1");
    });
  });

  describe("updateHomeSlide", () => {
    it("throws HomeSlideNotFoundError when slide does not exist", async () => {
      homeSlideFindUnique.mockResolvedValue(null);

      await expect(
        updateHomeSlide(
          {
            id: "slide-404",
            alt: "Updated alt",
            isActive: true,
          },
          "user-1",
        ),
      ).rejects.toBeInstanceOf(HomeSlideNotFoundError);
    });

    it("validates media folder if mediaId is being replaced", async () => {
      homeSlideFindUnique.mockResolvedValue({ id: "slide-1", mediaId: "media-1" });
      mediaAssetFindUnique.mockResolvedValue({
        id: "media-wrong",
        publicId: "vakratund/gallery/photo",
        kind: "IMAGE",
      });

      await expect(
        updateHomeSlide(
          {
            id: "slide-1",
            mediaId: "media-wrong",
            alt: "Updated alt",
            isActive: true,
          },
          "user-1",
        ),
      ).rejects.toBeInstanceOf(HomeSlideAssetInvalidError);
    });

    it("updates slide metadata successfully", async () => {
      homeSlideFindUnique.mockResolvedValue({ id: "slide-1", mediaId: "media-1" });
      homeSlideUpdate.mockResolvedValue({
        id: "slide-1",
        alt: "Updated alt text",
        title: "Updated title",
      });

      const result = await updateHomeSlide(
        {
          id: "slide-1",
          alt: "Updated alt text",
          title: "Updated title",
          isActive: true,
        },
        "user-1",
      );

      expect(result.alt).toBe("Updated alt text");
      expect(homeSlideUpdate).toHaveBeenCalled();
    });
  });

  describe("deleteHomeSlide", () => {
    it("deletes slide by id and handles nonexistent slide", async () => {
      homeSlideFindUnique.mockResolvedValue(null);
      await expect(deleteHomeSlide("slide-nonexistent", false, "user-1")).rejects.toBeInstanceOf(
        HomeSlideNotFoundError,
      );
    });

    it("deletes slide and preserves media asset when purgeMedia is false", async () => {
      homeSlideFindUnique.mockResolvedValue({
        id: "slide-1",
        mediaId: "media-1",
        media: { publicId: "vakratund/home/slide-1" },
      });
      homeSlideDelete.mockResolvedValue({ id: "slide-1" });

      await deleteHomeSlide("slide-1", false, "user-1");
      expect(homeSlideDelete).toHaveBeenCalledWith({ where: { id: "slide-1" } });
    });
  });

  describe("toggleHomeSlideActive & reorderHomeSlide", () => {
    it("toggles active state", async () => {
      homeSlideFindUnique.mockResolvedValue({ id: "slide-1", isActive: true });
      homeSlideUpdate.mockResolvedValue({ id: "slide-1", isActive: false });

      const updated = await toggleHomeSlideActive("slide-1", false, "user-1");
      expect(updated.isActive).toBe(false);
      expect(homeSlideUpdate).toHaveBeenCalledWith({
        where: { id: "slide-1" },
        data: { isActive: false },
      });
    });

    it("reorders slide up/down", async () => {
      const slides = [
        { id: "s1", sortOrder: 0 },
        { id: "s2", sortOrder: 1 },
        { id: "s3", sortOrder: 2 },
      ];
      homeSlideFindMany.mockResolvedValue(slides);
      transaction.mockImplementation(async (callback) => callback({ homeSlide: { update: homeSlideUpdate } }));

      await reorderHomeSlide("s2", "up", "user-1");
      expect(transaction).toHaveBeenCalled();
    });
  });

  describe("showcase settings & sample count", () => {
    it("returns default showcase settings when no record exists", async () => {
      pageSectionFindUnique.mockResolvedValue(null);
      const settings = await getHomeShowcaseSettings();
      expect(settings).toEqual({
        eyebrow: undefined,
        heading: undefined,
        speed: "normal",
        pauseOnHover: true,
      });
    });

    it("updates showcase settings in PageSection home/showcase", async () => {
      pageSectionUpsert.mockResolvedValue({
        id: "ps-1",
        page: "home",
        section: "showcase",
        content: { speed: "fast", pauseOnHover: false },
      });

      const updated = await updateHomeShowcaseSettings(
        { speed: "fast", pauseOnHover: false },
        "user-1",
      );
      expect(updated.speed).toBe("fast");
      expect(updated.pauseOnHover).toBe(false);
      expect(pageSectionUpsert).toHaveBeenCalled();
    });

    it("counts sample placeholder photos", async () => {
      homeSlideCount.mockResolvedValue(10);
      const count = await getSamplePhotosCount();
      expect(count).toBe(10);
      expect(homeSlideCount).toHaveBeenCalledWith({
        where: { isPlaceholder: true, isActive: true },
      });
    });
  });
});

