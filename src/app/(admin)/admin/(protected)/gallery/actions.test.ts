import { beforeEach, describe, expect, it, vi } from "vitest";

const requirePermission = vi.hoisted(() => vi.fn());
const bulkAddGalleryItems = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ requirePermission }));
vi.mock("@/server/services/gallery", () => ({
  bulkAddGalleryItems,
  createGalleryItem: vi.fn(),
  deleteGalleryItem: vi.fn(),
  GalleryItemNotFoundError: class GalleryItemNotFoundError extends Error {},
  GalleryMediaNotFoundError: class GalleryMediaNotFoundError extends Error {},
  listGalleryItems: vi.fn(),
  reorderGalleryItems: vi.fn(),
  updateGalleryItem: vi.fn(),
}));

import { bulkAddGallery } from "@/app/(admin)/admin/(protected)/gallery/actions";

const validInput = { mediaIds: ["cmj4media000000001"], category: "construction", title: "Building work", isVisible: true };

describe("gallery action authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bulkAddGalleryItems.mockResolvedValue([]);
  });

  it("allows an EDITOR to bulk-add gallery media", async () => {
    requirePermission.mockResolvedValue({ user: { id: "editor-1", role: "EDITOR" } });
    const result = await bulkAddGallery(validInput);
    expect(result.ok).toBe(true);
    expect(bulkAddGalleryItems).toHaveBeenCalledWith(expect.objectContaining({ category: "construction" }), "editor-1");
  });

  it("denies SALES before validation or execution", async () => {
    requirePermission.mockRejectedValue(new Error("Forbidden"));
    await expect(bulkAddGallery({})).rejects.toThrow("Forbidden");
    expect(bulkAddGalleryItems).not.toHaveBeenCalled();
  });
});

