import { describe, expect, it } from "vitest";
import { createGalleryCategorySchema, createGalleryYearSchema, moveGalleryYearItemsSchema } from "@/lib/validation/gallery";

describe("gallery validation", () => {
  it("accepts a valid category and rejects case-insensitive unsafe markup", () => {
    expect(createGalleryCategorySchema.safeParse({ name: "Building Construction", sortOrder: 0 }).success).toBe(true);
    expect(createGalleryCategorySchema.safeParse({ name: "<script>", sortOrder: 0 }).success).toBe(false);
  });

  it("accepts configured years only through current year plus one", () => {
    const current = new Date().getFullYear();
    expect(createGalleryYearSchema.safeParse({ year: current }).success).toBe(true);
    expect(createGalleryYearSchema.safeParse({ year: 1989 }).success).toBe(false);
    expect(createGalleryYearSchema.safeParse({ year: current + 2 }).success).toBe(false);
  });

  it("requires two distinct cuid-like year identifiers for moving items", () => {
    expect(moveGalleryYearItemsSchema.safeParse({ fromYearId: "cmj4gallery000000001", toYearId: "cmj4gallery000000002" }).success).toBe(true);
    expect(moveGalleryYearItemsSchema.safeParse({ fromYearId: "", toYearId: "" }).success).toBe(false);
  });
});
