import { beforeEach, describe, expect, it, vi } from "vitest";

const requirePermission = vi.hoisted(() => vi.fn());
const createRecord = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ requirePermission }));
vi.mock("@/server/services/testimonials", () => ({
  createTestimonial: createRecord,
  deleteTestimonial: vi.fn(),
  getTestimonial: vi.fn(),
  reorderTestimonials: vi.fn(),
  togglePublishTestimonial: vi.fn(),
  updateTestimonial: vi.fn(),
  TestimonialNotFoundError: class TestimonialNotFoundError extends Error {},
  TestimonialProjectNotFoundError: class TestimonialProjectNotFoundError extends Error {},
}));

import { createTestimonial } from "@/app/(admin)/admin/(protected)/testimonials/actions";

const validInput = { name: "A. Client", roleOrOrg: "Secretary", quote: "Excellent work.", rating: 5, projectId: null, photoId: null, status: "DRAFT", sortOrder: 0 };

describe("testimonial action authorization", () => {
  beforeEach(() => { vi.clearAllMocks(); createRecord.mockResolvedValue({ id: "testimonial-1" }); });
  it("allows EDITOR content mutations", async () => { requirePermission.mockResolvedValue({ user: { id: "editor-1", role: "EDITOR" } }); const result = await createTestimonial(validInput); expect(result.ok).toBe(true); expect(createRecord).toHaveBeenCalledWith(expect.objectContaining({ name: "A. Client" }), "editor-1"); });
  it("denies SALES before validation or execution", async () => { requirePermission.mockRejectedValue(new Error("Forbidden")); await expect(createTestimonial({})).rejects.toThrow("Forbidden"); expect(createRecord).not.toHaveBeenCalled(); });
});
