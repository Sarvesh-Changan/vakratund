import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirst = vi.hoisted(() => vi.fn());
const create = vi.hoisted(() => vi.fn());
const mediaFindUnique = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({ prisma: { service: { findFirst, create }, mediaAsset: { findUnique: mediaFindUnique } } }));
vi.mock("@/server/services/activity", () => ({ logActivity: vi.fn().mockResolvedValue({ id: "activity-1" }) }));

import { createService, ServiceCoverInvalidError, ServiceSlugConflictError } from "@/server/services/services";

const input = {
  title: "Building Construction",
  slug: undefined,
  group: "",
  shortDesc: "Construction service.",
  description: "A Markdown description.",
  scopeItems: ["RCC works"],
  processSteps: [],
  typicalProjects: "",
  audience: "",
  iconKey: "Building2" as const,
  coverId: null,
  isFeatured: false,
  status: "DRAFT" as const,
  sortOrder: 0,
  seoTitle: "Building Construction",
  seoDesc: "Construction services in Thane.",
};

const record = { ...input, id: "cmj4service000001", slug: "building-construction", createdAt: new Date("2026-10-01"), updatedAt: new Date("2026-10-01") };

describe("service mutation service", () => {
  beforeEach(() => { vi.clearAllMocks(); findFirst.mockResolvedValue(null); create.mockResolvedValue(record); mediaFindUnique.mockResolvedValue({ folder: "vakratund/services", publicId: "vakratund/services/cover", kind: "IMAGE" }); });

  it("generates a slug and persists it", async () => {
    const result = await createService(input, "user-1");
    expect(result.slug).toBe("building-construction");
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ slug: "building-construction" }) }));
  });

  it("rejects a slug already used by another service", async () => {
    findFirst.mockResolvedValue({ id: "other-service" });
    await expect(createService({ ...input, slug: "building-construction" }, "user-1")).rejects.toBeInstanceOf(ServiceSlugConflictError);
    expect(create).not.toHaveBeenCalled();
  });

  it("stores the uploaded services asset as coverId", async () => {
    await createService({ ...input, coverId: "cmj4media00000000000000001" }, "user-1");
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ coverId: "cmj4media00000000000000001" }) }));
  });

  it("rejects a gallery asset as a service cover", async () => {
    mediaFindUnique.mockResolvedValue({ folder: "vakratund/gallery", publicId: "vakratund/gallery/test", kind: "IMAGE" });
    await expect(createService({ ...input, coverId: "cmj4media00000000000000001" }, "user-1")).rejects.toBeInstanceOf(ServiceCoverInvalidError);
    expect(create).not.toHaveBeenCalled();
  });
});
