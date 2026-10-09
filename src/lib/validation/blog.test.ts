import { describe, expect, it } from "vitest";

import { createBlogCategorySchema, createBlogPostSchema } from "@/lib/validation/blog";
import { calculateReadingMinutes } from "@/lib/blog/reading-time";

describe("blog validation and reading time", () => {
  it("accepts Markdown content but rejects HTML in plain-text fields", () => {
    const result = createBlogPostSchema.safeParse({ title: "Repair planning", slug: "", excerpt: "A practical guide.", content: "# Inspect first\n\n<script>alert(1)</script>", coverId: null, categoryId: null, authorId: null, status: "DRAFT", publishedAt: "", seoTitle: "", seoDesc: "" });
    expect(result.success).toBe(true);
    expect(createBlogPostSchema.safeParse({ title: "<b>Unsafe</b>", slug: "", excerpt: "Excerpt", content: "Content", coverId: null, categoryId: null, authorId: null, status: "DRAFT", publishedAt: null, seoTitle: "", seoDesc: "" }).success).toBe(false);
  });

  it("validates future publication dates and category fields", () => {
    const parsed = createBlogPostSchema.safeParse({ title: "Scheduled", slug: "scheduled", excerpt: "Excerpt", content: "Content", coverId: null, categoryId: null, authorId: null, status: "PUBLISHED", publishedAt: "2030-01-01T00:00:00.000Z", seoTitle: "", seoDesc: "" });
    expect(parsed.success).toBe(true);
    expect(createBlogCategorySchema.safeParse({ name: "Repairs", slug: "repairs" }).success).toBe(true);
    expect(createBlogCategorySchema.safeParse({ name: "<b>Unsafe</b>", slug: "repairs" }).success).toBe(false);
  });

  it("calculates at least one minute and rounds longer content up", () => {
    expect(calculateReadingMinutes("")).toBe(1);
    expect(calculateReadingMinutes(Array.from({ length: 201 }, () => "word").join(" "))).toBe(2);
  });
});
