import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: () => unknown) => fn }));
vi.mock("@/lib/db/client", () => ({ prisma: {} }));

import { normalizeHomeCta, normalizeHomeHero, normalizeHomeProcess } from "@/server/queries/home";

describe("home PageSection normalization", () => {
  it("supplies route defaults for legacy hero content", () => {
    const hero = normalizeHomeHero({ eyebrow: "Eyebrow", title: "Title", description: "Description", primaryCta: "Quote", secondaryCta: "Call" });
    expect(hero).toMatchObject({ primaryHref: "/estimate", secondaryHref: "tel:+919821502956", backgroundImageId: null });
  });

  it("normalizes seeded string process steps into accessible step records", () => {
    const process = normalizeHomeProcess({ title: "Our process", steps: ["Survey", "Plan", "Execute", "Handover"] });
    expect(process?.steps).toEqual([{ title: "Survey", description: "" }, { title: "Plan", description: "" }, { title: "Execute", description: "" }, { title: "Handover", description: "" }]);
  });

  it("supplies route defaults for legacy CTA content", () => {
    const cta = normalizeHomeCta({ title: "Quality is our first priority", primaryCta: "Get Free Quote", secondaryCta: "Request Site Inspection" });
    expect(cta).toMatchObject({ description: "", primaryHref: "/estimate", secondaryHref: "/contact?type=inspection" });
  });
});
