import { describe, expect, it } from "vitest";

import { createServiceSchema } from "@/lib/validation/services";

const valid = {
  title: "Building Construction",
  slug: "",
  shortDesc: "Residential and commercial construction.",
  description: "## Scope\n\nReliable construction delivery.",
  scopeItems: ["RCC works"],
  iconKey: "Building2" as const,
  coverId: null,
  isFeatured: false,
  status: "DRAFT" as const,
  sortOrder: 0,
  seoTitle: "Building Construction in Thane",
  seoDesc: "Construction services for residential and commercial projects in Thane.",
};

describe("service validation", () => {
  it("accepts repeatable scope items and blank auto-slug", () => {
    const result = createServiceSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.slug).toBeUndefined();
  });

  it("rejects HTML in plain text and unknown keys", () => {
    expect(createServiceSchema.safeParse({ ...valid, shortDesc: "<img src=x>" }).success).toBe(false);
    expect(createServiceSchema.safeParse({ ...valid, unexpected: true }).success).toBe(false);
  });
});
