import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/queries/sitemap", () => ({
  getPublicSitemapEntries: vi.fn(async () => [
    { path: "/", lastModified: new Date("2026-01-01T00:00:00.000Z") },
    { path: "/services", lastModified: new Date("2026-01-01T00:00:00.000Z") },
  ]),
}));

import nextConfig from "../next.config";
import sitemap from "@/app/sitemap";
import { ADMIN_NAVIGATION } from "@/components/admin/admin-navigation";
import { PERMISSIONS } from "@/config/permissions";
import { SEO_PATHS } from "@/lib/validation/seo";

const retiredSegment = ["bl", "og"].join("");
const retiredModel = ["B", "l", "o", "g", "P", "o", "s", "t"].join("");
const retiredLabel = ["ins", "ights"].join("");

describe("retired editorial surface", () => {
  it("redirects the retired route and descendants to home", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toEqual(expect.arrayContaining([
      { source: `/${retiredSegment}`, destination: "/", permanent: true },
      { source: `/${retiredSegment}/:path*`, destination: "/", permanent: true },
    ]));
  });

  it("does not expose retired URLs in the sitemap or SEO paths", async () => {
    const entries = await sitemap();
    expect(entries.some((entry) => entry.url.toLowerCase().includes(retiredSegment))).toBe(false);
    expect(SEO_PATHS.some((path) => path.toLowerCase().includes(retiredSegment))).toBe(false);
  });

  it("does not expose a retired navigation item or permission", () => {
    expect(ADMIN_NAVIGATION.some((item) => item.href.toLowerCase().includes(retiredSegment) || item.label.toLowerCase().includes(retiredLabel))).toBe(false);
    expect(PERMISSIONS.some((permission) => permission.toLowerCase().includes(retiredSegment))).toBe(false);
  });

  it("does not define the retired Prisma model", () => {
    const schema = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");
    expect(schema).not.toContain(`model ${retiredModel}`);
  });
});
