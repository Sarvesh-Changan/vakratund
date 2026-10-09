import { describe, expect, it } from "vitest";
import { parseProjectSearchParams } from "./public-projects";

describe("public project filters", () => {
  it("accepts valid filters and pagination", () => {
    expect(parseProjectSearchParams({ service: "building-construction", status: "COMPLETED", year: "2025", page: "2" })).toEqual({ filters: { serviceSlug: "building-construction", status: "COMPLETED", year: 2025 }, page: 2 });
  });

  it("falls back safely for invalid query values", () => {
    expect(parseProjectSearchParams({ service: "<script>", status: "BAD", year: "not-a-year", page: "0" })).toEqual({ filters: {}, page: 1 });
  });
});
