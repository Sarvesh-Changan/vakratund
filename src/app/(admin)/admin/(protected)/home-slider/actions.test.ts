import { beforeEach, describe, expect, it, vi } from "vitest";

const requirePermission = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
const revalidateTag = vi.hoisted(() => vi.fn());

const createSlideService = vi.hoisted(() => vi.fn());
const updateSlideService = vi.hoisted(() => vi.fn());
const deleteSlideService = vi.hoisted(() => vi.fn());
const deleteAllSlideService = vi.hoisted(() => vi.fn());
const toggleSlideService = vi.hoisted(() => vi.fn());
const reorderSlideService = vi.hoisted(() => vi.fn());
const setOrderService = vi.hoisted(() => vi.fn());
const updateSettingsService = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath, revalidateTag }));
vi.mock("@/lib/auth/session", () => ({ requirePermission }));
vi.mock("@/server/services/home-slides", () => ({
  createHomeSlide: createSlideService,
  updateHomeSlide: updateSlideService,
  deleteHomeSlide: deleteSlideService,
  deleteAllHomeSlides: deleteAllSlideService,
  toggleHomeSlideActive: toggleSlideService,
  reorderHomeSlide: reorderSlideService,
  setHomeSlideOrder: setOrderService,
  updateHomeShowcaseSettings: updateSettingsService,
  HomeSlideNotFoundError: class HomeSlideNotFoundError extends Error {},
  HomeSlideAssetNotFoundError: class HomeSlideAssetNotFoundError extends Error {},
  HomeSlideAssetInvalidError: class HomeSlideAssetInvalidError extends Error {},
}));

import {
  createHomeSlideAction,
  deleteHomeSlideAction,
  deleteAllHomeSlidesAction,
  reorderHomeSlideAction,
  setHomeSlideOrderAction,
  toggleHomeSlideActiveAction,
  updateHomeShowcaseSettingsAction,
  updateHomeSlideAction,
} from "@/app/(admin)/admin/(protected)/home-slider/actions";

describe("home-slider server actions authorization & validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("permission enforcement", () => {
    it("denies SALES (throws Forbidden error) and does not call service", async () => {
      requirePermission.mockRejectedValue(new Error("Forbidden: missing permission content:write"));

      await expect(
        createHomeSlideAction({
          mediaId: "cmj0000000000000000000001",
          alt: "Valid alt text",
        }),
      ).rejects.toThrow("Forbidden: missing permission content:write");

      expect(createSlideService).not.toHaveBeenCalled();
    });

    it("allows EDITOR / ADMIN with content:write", async () => {
      requirePermission.mockResolvedValue({ user: { id: "editor-1", role: "EDITOR" } });
      createSlideService.mockResolvedValue({ id: "s-1" });

      const res = await createHomeSlideAction({
        mediaId: "cmj0000000000000000000001",
        alt: "Valid alt text",
      });

      expect(res.ok).toBe(true);
      expect(createSlideService).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/");
      expect(revalidateTag).toHaveBeenCalledWith("homeSlider", "max");
    });
  });

  describe("validation enforcement & actions execution", () => {
    beforeEach(() => {
      requirePermission.mockResolvedValue({ user: { id: "editor-1", role: "EDITOR" } });
    });

    it("rejects createHomeSlide when alt is empty", async () => {
      const res = await createHomeSlideAction({
        mediaId: "cmj0000000000000000000001",
        alt: "",
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.fieldErrors?.alt?.[0]).toMatch(/text is required/i);
      }
      expect(createSlideService).not.toHaveBeenCalled();
    });

    it("rejects invalid linkUrl (not starting with / or https://)", async () => {
      const res = await createHomeSlideAction({
        mediaId: "cmj0000000000000000000001",
        alt: "Valid alt text",
        linkUrl: "javascript:alert(1)",
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.fieldErrors?.linkUrl?.[0]).toMatch(/internal path.*or an https.*url/i);
      }
      expect(createSlideService).not.toHaveBeenCalled();
    });

    it("accepts internal link starting with /", async () => {
      createSlideService.mockResolvedValue({ id: "s-1" });
      const res = await createHomeSlideAction({
        mediaId: "cmj0000000000000000000001",
        alt: "Valid alt text",
        linkUrl: "/services/structural-repairs",
      });

      expect(res.ok).toBe(true);
      expect(createSlideService).toHaveBeenCalled();
    });

    it("executes updateHomeSlideAction", async () => {
      updateSlideService.mockResolvedValue({ id: "s-1", alt: "Updated" });
      const res = await updateHomeSlideAction({
        id: "cmj0000000000000000000001",
        alt: "Updated alt text",
        isActive: true,
      });

      expect(res.ok).toBe(true);
      expect(updateSlideService).toHaveBeenCalled();
    });

    it("executes deleteHomeSlideAction", async () => {
      deleteSlideService.mockResolvedValue({ id: "s-1" });
      const res = await deleteHomeSlideAction({
        id: "cmj0000000000000000000001",
        deleteCloudinaryAsset: false,
      });

      expect(res.ok).toBe(true);
      expect(deleteSlideService).toHaveBeenCalled();
    });

    it("executes toggleHomeSlideActiveAction", async () => {
      toggleSlideService.mockResolvedValue({ id: "s-1", isActive: false });
      const res = await toggleHomeSlideActiveAction({
        id: "cmj0000000000000000000001",
        isActive: false,
      });

      expect(res.ok).toBe(true);
      expect(toggleSlideService).toHaveBeenCalled();
    });

    it("executes reorderHomeSlideAction and setHomeSlideOrderAction", async () => {
      reorderSlideService.mockResolvedValue({ id: "s-1" });
      const res1 = await reorderHomeSlideAction({
        id: "cmj0000000000000000000001",
        direction: "up",
      });
      expect(res1.ok).toBe(true);

      setOrderService.mockResolvedValue(undefined);
      const res2 = await setHomeSlideOrderAction({
        orderedIds: ["cmj0000000000000000000001", "cmj0000000000000000000002"],
      });
      expect(res2.ok).toBe(true);
    });

    it("executes updateHomeShowcaseSettingsAction", async () => {
      updateSettingsService.mockResolvedValue({ speed: "fast", pauseOnHover: true });
      const res = await updateHomeShowcaseSettingsAction({
        speed: "fast",
        pauseOnHover: true,
      });

      expect(res.ok).toBe(true);
      expect(updateSettingsService).toHaveBeenCalled();
    });

    it("executes deleteAllHomeSlidesAction", async () => {
      deleteAllSlideService.mockResolvedValue({ deletedCount: 5, cloudinaryDeletedCount: 3 });
      const res = await deleteAllHomeSlidesAction({ deleteCloudinaryAssets: true });

      expect(res.ok).toBe(true);
      expect(deleteAllSlideService).toHaveBeenCalledWith(true, "editor-1");
      expect(revalidatePath).toHaveBeenCalledWith("/admin/home-slider");
    });
  });
});
