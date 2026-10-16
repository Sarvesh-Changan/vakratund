import { beforeEach, describe, expect, it, vi } from "vitest";

const requirePermission = vi.hoisted(() => vi.fn());
const toggleRecord = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ requirePermission }));
vi.mock("@/server/services/gallery", () => ({
  createGalleryCategory: vi.fn(),
  createGalleryItem: vi.fn(),
  deleteGalleryCategory: vi.fn(),
  deleteGalleryItem: vi.fn(),
  findGalleryDuplicate: vi.fn(),
  GalleryAssetInvalidError: class GalleryAssetInvalidError extends Error {},
  GalleryAssetNotFoundError: class GalleryAssetNotFoundError extends Error {},
  GalleryCategoryNameConflictError: class GalleryCategoryNameConflictError extends Error {},
  GalleryCategoryNotFoundError: class GalleryCategoryNotFoundError extends Error {},
  GalleryCategorySlugConflictError: class GalleryCategorySlugConflictError extends Error {},
  GalleryDuplicateEtagError: class GalleryDuplicateEtagError extends Error {},
  GalleryItemNotFoundError: class GalleryItemNotFoundError extends Error {},
  listGalleryCategories: vi.fn(),
  listGalleryItems: vi.fn(),
  reorderGalleryCategory: vi.fn(),
  reorderGalleryItem: vi.fn(),
  syncMissingGalleryMetadata: vi.fn(),
  toggleGalleryItem: toggleRecord,
  updateGalleryCategory: vi.fn(),
  updateGalleryItem: vi.fn(),
}));

import { toggleGalleryItem } from "@/app/(admin)/admin/(protected)/gallery/actions";

describe("gallery inline-toggle authorization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows an EDITOR to toggle a gallery item", async () => {
    requirePermission.mockResolvedValue({ user: { id: "editor-1", role: "EDITOR" } });
    toggleRecord.mockResolvedValue({ category: { slug: "painting" } });
    const result = await toggleGalleryItem({ id: "cmj4gallery000000001", flag: "isFeatured", value: true });
    expect(result.ok).toBe(true);
    expect(toggleRecord).toHaveBeenCalledWith({ id: "cmj4gallery000000001", flag: "isFeatured", value: true }, "editor-1");
  });

  it("denies SALES before validation or execution", async () => {
    requirePermission.mockRejectedValue(new Error("Forbidden"));
    await expect(toggleGalleryItem({})).rejects.toThrow("Forbidden");
    expect(toggleRecord).not.toHaveBeenCalled();
  });
});
