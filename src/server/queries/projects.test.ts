import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({ prisma: {} }));

import { toPublicProject } from "@/server/queries/projects";

type PublicProjectRecord = Parameters<typeof toPublicProject>[0];

const project = {
  id: "project-1",
  slug: "private-client-project",
  title: "Private client project",
  summary: "Project summary",
  description: null,
  service: null,
  clientName: "Private Client",
  showClientName: false,
  locationText: "Thane",
  areaSqft: 15000,
  floorsText: "Ground + 5",
  scopeText: "PMC",
  year: 2025,
  status: "COMPLETED" as const,
  progressPct: null,
  isFeatured: false,
  sortOrder: 0,
  seoTitle: null,
  seoDesc: null,
  media: [{ id: "project-media-1", mediaId: "media-1", isCover: true, isBefore: false, isAfter: false, sortOrder: 0, media: { kind: "IMAGE" as const, url: "https://res.cloudinary.com/example/image/upload/project.jpg", alt: "Building exterior", width: 1200, height: 800 } }],
} satisfies PublicProjectRecord;

describe("public project privacy", () => {
  it("does not expose clientName when showClientName is false", () => {
    const result = toPublicProject(project);
    expect(result).not.toHaveProperty("clientName");
  });

  it("exposes clientName only when the consent toggle is true", () => {
    const result = toPublicProject({ ...project, showClientName: true });
    expect(result.clientName).toBe("Private Client");
  });
});

