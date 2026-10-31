import { beforeEach, describe, expect, it, vi } from "vitest";

const requirePermissionMock = vi.hoisted(() => vi.fn());
const createMediaAssetMock = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ requirePermission: requirePermissionMock }));
vi.mock("@/lib/env", () => ({ env: { CLOUDINARY_CLOUD_NAME: "example" } }));
vi.mock("@/server/services/media", () => ({
  createMediaAsset: createMediaAssetMock,
  deleteMediaAsset: vi.fn(),
  findUnusedImageAssets: vi.fn(),
  MediaAssetInUseError: class MediaAssetInUseError extends Error {},
  updateMediaAsset: vi.fn(),
  listMediaAssets: vi.fn(),
}));

import { saveMediaAsset } from "./actions";

describe("saveMediaAsset image format security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requirePermissionMock.mockResolvedValue({ user: { id: "editor" } });
  });

  it("rejects SVG in the page upload section before writing a media asset", async () => {
    const result = await saveMediaAsset({ section: "pages", publicId: "vakratund/pages/story", url: "https://res.cloudinary.com/example/image/upload/v1/vakratund/pages/story.svg", kind: "IMAGE", format: "svg", bytes: 1024, etag: "etag", width: 800, height: 600, alt: "Construction illustration" });
    expect(result.ok).toBe(false);
    expect(createMediaAssetMock).not.toHaveBeenCalled();
  });
});

