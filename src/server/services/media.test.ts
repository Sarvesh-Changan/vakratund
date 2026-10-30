import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({ prisma: {} }));
import { findUnusedImageAssets, type MediaAssetView } from "@/server/services/media";

const asset = (id: string, kind: MediaAssetView["kind"], usageCount: number): MediaAssetView => ({ id, kind, publicId: `vakratund/gallery/${id}`, url: "https://res.cloudinary.com/example/image/upload/image.jpg", format: "jpg", width: 1200, height: 800, bytes: 1000, etag: "etag", alt: "Photo", caption: null, folder: "vakratund/gallery", createdAt: "2026-10-31T00:00:00.000Z", usageCount, usages: [] });

describe("unused media finder", () => {
  it("never includes referenced assets or non-images", () => {
    const result = findUnusedImageAssets([asset("unused", "IMAGE", 0), asset("used", "IMAGE", 1), asset("document", "DOCUMENT", 0)]);
    expect(result.map((item) => item.id)).toEqual(["unused"]);
  });
});
