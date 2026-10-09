import { describe, expect, it } from "vitest";
import { parseBlogSearchParams } from "./public-blog";

describe("public blog filters", () => {
  it("accepts a category and page", () => {
    expect(parseBlogSearchParams({ category: "structural-repairs", page: "2" })).toEqual({ categorySlug: "structural-repairs", page: 2 });
  });

  it("falls back safely for invalid values", () => {
    expect(parseBlogSearchParams({ category: "<script>", page: "0" })).toEqual({ page: 1 });
  });
});
