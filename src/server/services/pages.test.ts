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

  it("saves about expertise section with three blocks", async () => {
    const result = await savePageSection({
      pageKey: "about",
      sectionKey: "expertise",
      isVisible: true,
      content: {
        eyebrow: "Our aim and values",
        title: "Genuine engineering solutions and repair expertise",
        description: "Dedicated civil engineering.",
        blocks: [
          { title: "Genuine engineering solutions", description: "Civil engineering services and solutions." },
          { title: "Repair-led expertise", description: "Repairs and rehabilitation of RCC structures." },
          { title: "Working in tandem", description: "Working in tandem with consultants and clients." },
        ],
      },
    }, "admin");

    expect(sectionUpsert).toHaveBeenCalled();
    expect(result.sectionKey).toBe("expertise");
  });

  it("saves about credentials section with validated pages logo", async () => {
    mediaFindUnique.mockResolvedValue({ folder: "vakratund/pages", publicId: "vakratund/pages/msme_logo", kind: "IMAGE" });
    const result = await savePageSection({
      pageKey: "about",
      sectionKey: "credentials",
      isVisible: true,
      content: {
        eyebrow: "Credentials",
        title: "Registered and responsibly covered",
        description: "Official statutory registrations.",
        items: [
          { id: "msme", label: "MSME registration", value: "Registered", mediaId: "cmj4media00000000000000002", isVisible: true },
          { id: "workmen_insurance", label: "Workmen's compensation", value: "Covered", mediaId: null, isVisible: true },
        ],
      },
    }, "admin");

    expect(sectionUpsert).toHaveBeenCalled();
    expect(result.sectionKey).toBe("credentials");
  });

  it("rejects credential logo uploaded to wrong folder", async () => {
    mediaFindUnique.mockResolvedValue({ folder: "vakratund/projects", publicId: "vakratund/projects/logo", kind: "IMAGE" });
    await expect(savePageSection({
      pageKey: "about",
      sectionKey: "credentials",
      isVisible: true,
      content: {
        eyebrow: "Credentials",
        title: "Registered and covered",
        description: "",
        items: [
          { id: "msme", label: "MSME registration", value: "Registered", mediaId: "cmj4media00000000000000003", isVisible: true },
        ],
      },
    }, "admin")).rejects.toThrow("pages section");

    expect(sectionUpsert).not.toHaveBeenCalled();
  });
});
