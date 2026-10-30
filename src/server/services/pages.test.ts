import { beforeEach, describe, expect, it, vi } from "vitest";

const mediaFindUnique = vi.hoisted(() => vi.fn());
const sectionUpsert = vi.hoisted(() => vi.fn());
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({ prisma: { mediaAsset: { findUnique: mediaFindUnique }, pageSection: { upsert: sectionUpsert } } }));
vi.mock("@/server/services/activity", () => ({ logActivity: vi.fn().mockResolvedValue({ id: "activity" }) }));

import { savePageSection } from "@/server/services/pages";

describe("About story media save", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mediaFindUnique.mockResolvedValue({ folder: "vakratund/pages", publicId: "vakratund/pages/story", kind: "IMAGE" });
    sectionUpsert.mockImplementation(async ({ create }) => ({ id: "section-1", ...create, sortOrder: 0, updatedAt: new Date("2026-10-31T00:00:00.000Z") }));
  });

  it("saves a page-scoped story image in section content", async () => {
    const result = await savePageSection({ pageKey: "about", sectionKey: "story", isVisible: true, content: { title: "Our story", body: "Since 2003.", imageMediaId: "cmj4media00000000000000001", imageAlt: "Construction site" } }, "admin");
    expect(sectionUpsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ content: expect.objectContaining({ imageMediaId: "cmj4media00000000000000001", imageAlt: "Construction site" }) }) }));
    expect(result.sectionKey).toBe("story");
  });

  it("rejects attaching an image from the shared gallery", async () => {
    mediaFindUnique.mockResolvedValue({ folder: "vakratund/gallery", publicId: "vakratund/gallery/test", kind: "IMAGE" });
    await expect(savePageSection({ pageKey: "about", sectionKey: "story", isVisible: true, content: { title: "Our story", body: "Since 2003.", imageMediaId: "cmj4media00000000000000001", imageAlt: "Construction site" } }, "admin")).rejects.toThrow("pages section");
    expect(sectionUpsert).not.toHaveBeenCalled();
  });
});
