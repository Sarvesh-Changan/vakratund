import { describe, expect, it, vi } from "vitest";

const projectFindFirst = vi.hoisted(() => vi.fn());
const mediaFindMany = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({ prisma: { project: { findFirst: projectFindFirst }, mediaAsset: { findMany: mediaFindMany } } }));
vi.mock("@/server/services/activity", () => ({ logActivity: vi.fn() }));

import { createProject, ProjectPublishValidationError, projectPublishFieldErrors } from "@/server/services/projects";

describe("project publish rules", () => {
  it("requires title, slug, summary, and an image", () => {
    expect(projectPublishFieldErrors({ title: "", slug: undefined, summary: "" }, ["VIDEO"])).toEqual({
      title: ["Title is required before publishing."],
      slug: ["A valid slug is required before publishing."],
      summary: ["Summary is required before publishing."],
      media: ["Add at least one image before publishing."],
    });
  });

  it("accepts a complete project with an image", () => {
    expect(projectPublishFieldErrors({ title: "Repair project", slug: "repair-project", summary: "A completed repair." }, ["IMAGE"])).toEqual({});
  });

  it("enforces the image requirement in the service before writing", async () => {
    projectFindFirst.mockResolvedValue(null);
    mediaFindMany.mockResolvedValue([]);
    await expect(createProject({
      title: "Repair project",
      slug: "repair-project",
      summary: "A completed repair.",
      description: "",
      serviceId: null,
      clientName: "",
      showClientName: false,
      locationText: "Thane",
      areaSqft: null,
      floorsText: "",
      scopeText: "Repairs",
      year: 2025,
      status: "COMPLETED",
      progressPct: null,
      isFeatured: false,
      publishStatus: "PUBLISHED",
      sortOrder: 0,
      seoTitle: "",
      seoDesc: "",
      media: [],
    }, "user-1")).rejects.toBeInstanceOf(ProjectPublishValidationError);
  });
});

