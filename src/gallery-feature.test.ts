import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { primaryNavigation } from "@/config/navigation";
import { PERMISSIONS } from "@/config/permissions";
import { SEO_PATHS } from "@/lib/validation/seo";

describe("gallery feature contract", () => {
  it("exposes Gallery but not the retired editorial label", () => {
    const retiredEditorialLabel = ["ins", "ights"].join("");
    expect(primaryNavigation).toContainEqual({ label: "Gallery", href: "/gallery" });
    expect(primaryNavigation.some((item) => item.label.toLowerCase().includes(retiredEditorialLabel))).toBe(false);
  });

  it("includes the canonical gallery path and no gallery-only permission", () => {
    expect(SEO_PATHS).toContain("/gallery");
    expect(PERMISSIONS.some((permission) => permission.toLowerCase().includes("gallery"))).toBe(false);
  });

  it("uses the year-aware Prisma model shape", () => {
    const schema = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");
    expect(schema).toContain("model GalleryYear");
    expect(schema).toContain("yearId          String");
    expect(schema).not.toContain("designType      GalleryDesignType");
  });
});
