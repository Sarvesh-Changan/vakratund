import { beforeEach, describe, expect, it, vi } from "vitest";

const requirePermission = vi.hoisted(() => vi.fn());
const createProjectRecord = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ requirePermission }));
vi.mock("@/server/services/projects", () => ({
  createProject: createProjectRecord,
  deleteProject: vi.fn(),
  getProject: vi.fn(),
  reorderProjects: vi.fn(),
  togglePublishProject: vi.fn(),
  updateProject: vi.fn(),
  ProjectNotFoundError: class ProjectNotFoundError extends Error {},
  ProjectPublishValidationError: class ProjectPublishValidationError extends Error {},
  ProjectServiceNotFoundError: class ProjectServiceNotFoundError extends Error {},
  ProjectSlugConflictError: class ProjectSlugConflictError extends Error {},
}));

import { createProject } from "@/app/(admin)/admin/(protected)/projects/actions";

const validInput = {
  title: "Building repair",
  slug: "",
  summary: "A completed repair project.",
  description: "",
  serviceId: null,
  clientName: "",
  showClientName: false,
  locationText: "Thane",
  areaSqft: 1000,
  floorsText: "Ground + 5",
  scopeText: "Repairs",
  year: 2025,
  status: "COMPLETED",
  progressPct: null,
  isFeatured: false,
  publishStatus: "DRAFT",
  sortOrder: 0,
  seoTitle: "",
  seoDesc: "",
  media: [],
};

describe("project action authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createProjectRecord.mockResolvedValue({ id: "project-1", slug: "building-repair" });
  });

  it("allows an EDITOR to create a project", async () => {
    requirePermission.mockResolvedValue({ user: { id: "editor-1", role: "EDITOR" } });
    const result = await createProject(validInput);
    expect(result.ok).toBe(true);
    expect(createProjectRecord).toHaveBeenCalledWith(expect.objectContaining({ title: "Building repair" }), "editor-1");
  });

  it("denies SALES before validation or execution", async () => {
    requirePermission.mockRejectedValue(new Error("Forbidden"));
    await expect(createProject({})).rejects.toThrow("Forbidden");
    expect(createProjectRecord).not.toHaveBeenCalled();
  });
});

