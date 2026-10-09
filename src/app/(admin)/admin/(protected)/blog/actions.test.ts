import { beforeEach, describe, expect, it, vi } from "vitest";

const requirePermission = vi.hoisted(() => vi.fn());
const createRecord = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ requirePermission }));
vi.mock("@/server/services/blog", () => ({ createBlogPost: createRecord, updateBlogPost: vi.fn(), deleteBlogPost: vi.fn(), getBlogPost: vi.fn(), togglePublishBlogPost: vi.fn(), createBlogCategory: vi.fn(), updateBlogCategory: vi.fn(), deleteBlogCategory: vi.fn(), BlogCategoryNotFoundError: class BlogCategoryNotFoundError extends Error {}, BlogCategorySlugConflictError: class BlogCategorySlugConflictError extends Error {}, BlogCoverMustBeImageError: class BlogCoverMustBeImageError extends Error {}, BlogPostNotFoundError: class BlogPostNotFoundError extends Error {}, BlogRelationNotFoundError: class BlogRelationNotFoundError extends Error {}, BlogSlugConflictError: class BlogSlugConflictError extends Error {} }));

import { createBlogPost } from "@/app/(admin)/admin/(protected)/blog/actions";

const validInput = { title: "Repair planning", slug: "", excerpt: "A practical guide.", content: "# Inspect first", coverId: null, categoryId: null, authorId: null, status: "DRAFT", publishedAt: null, seoTitle: "", seoDesc: "" };

describe("blog action authorization", () => {
  beforeEach(() => { vi.clearAllMocks(); createRecord.mockResolvedValue({ id: "post-1", slug: "repair-planning" }); });
  it("allows EDITOR blog mutations", async () => { requirePermission.mockResolvedValue({ user: { id: "editor-1", role: "EDITOR" } }); const result = await createBlogPost(validInput); expect(result.ok).toBe(true); expect(createRecord).toHaveBeenCalledWith(expect.objectContaining({ title: "Repair planning" }), "editor-1"); });
  it("denies SALES before validation or execution", async () => { requirePermission.mockRejectedValue(new Error("Forbidden")); await expect(createBlogPost({})).rejects.toThrow("Forbidden"); expect(createRecord).not.toHaveBeenCalled(); });
});
