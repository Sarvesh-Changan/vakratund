import { describe, expect, it, vi } from "vitest";

const cacheCalls = vi.hoisted(() => vi.fn());
const findMany = vi.hoisted(() => vi.fn());
const findFirst = vi.hoisted(() => vi.fn());
const mediaFindMany = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: () => Promise<unknown>, key: string[], options: { tags: string[] }) => { cacheCalls({ key, options }); return fn; } }));
vi.mock("@/lib/db/client", () => ({ prisma: { blogPost: { findMany, findFirst }, blogCategory: { findMany }, mediaAsset: { findMany: mediaFindMany } } }));

import { getPublishedBlogPosts, isBlogPostPublic, publishedBlogWhere } from "@/server/queries/blog";

describe("public blog scheduling", () => {
  it("keeps future posts hidden and allows due published posts", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    expect(isBlogPostPublic("PUBLISHED", new Date("2026-01-02T00:00:00.000Z"), now)).toBe(false);
    expect(isBlogPostPublic("PUBLISHED", new Date("2025-12-31T23:59:59.000Z"), now)).toBe(true);
    expect(isBlogPostPublic("DRAFT", new Date("2025-12-31T23:59:59.000Z"), now)).toBe(false);
    expect(publishedBlogWhere(now)).toEqual({ status: "PUBLISHED", publishedAt: { not: null, lte: now } });
  });

  it("queries only due published posts and uses the blog cache tag", async () => {
    findMany.mockResolvedValue([]); mediaFindMany.mockResolvedValue([]);
    await getPublishedBlogPosts();
    const call = findMany.mock.calls[0]?.[0] as { where: { status: string; publishedAt: { not: null; lte: Date } } };
    expect(call.where.status).toBe("PUBLISHED");
    expect(call.where.publishedAt.not).toBeNull();
    expect(call.where.publishedAt.lte).toBeInstanceOf(Date);
    expect(cacheCalls).toHaveBeenCalledWith(expect.objectContaining({ options: { tags: ["blog"], revalidate: 60 } }));
    expect(findFirst).not.toHaveBeenCalled();
  });
});
