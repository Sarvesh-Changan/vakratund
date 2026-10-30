import { describe, expect, it } from "vitest";
import { pageSectionInputSchema, pageSectionSchemas } from "./pages";

describe("homepage PageSection content", () => {
  it("allows an empty stats row without inventing placeholder numbers", () => {
    expect(pageSectionSchemas.home.stats.safeParse({ items: [] }).success).toBe(true);
  });

  it("keeps legacy About story content valid and validates an optional image alt", () => {
    expect(pageSectionSchemas.about.story.safeParse({ title: "Our story", body: "Since 2003." }).success).toBe(true);
    expect(pageSectionSchemas.about.story.safeParse({ title: "Our story", body: "Since 2003.", imageMediaId: "cmj4media00000000000000001", imageAlt: "Construction work" }).success).toBe(true);
    expect(pageSectionSchemas.about.story.safeParse({ title: "Our story", body: "Since 2003.", imageMediaId: "cmj4media00000000000000001", imageAlt: "" }).success).toBe(false);
  });

  it("limits the proof row to five admin-entered facts", () => {
    const items = Array.from({ length: 6 }, (_, index) => ({ label: `Fact ${index}`, value: String(index) }));
    expect(pageSectionSchemas.home.stats.safeParse({ items }).success).toBe(false);
  });

  it("accepts editable hero trust chips and featured-project copy", () => {
    expect(pageSectionInputSchema.safeParse({ pageKey: "home", sectionKey: "hero", isVisible: true, content: { title: "Headline", description: "Sub-line", trustChips: ["MSME registered", "Insured workforce", "Since 2003"], primaryCta: "Get Free Quote", primaryHref: "/estimate", secondaryCta: "Call Now", secondaryHref: "tel:+919821502956", backgroundImageId: null } }).success).toBe(true);
    expect(pageSectionInputSchema.safeParse({ pageKey: "home", sectionKey: "projects", isVisible: true, content: { eyebrow: "Featured work", title: "Selected projects", description: "", viewAllLabel: "View all projects" } }).success).toBe(true);
  });

  it("keeps an unapproved proprietor quote empty and accepts the editable homepage sections", () => {
    expect(pageSectionSchemas.home.why.safeParse({ eyebrow: "Leadership", title: "Why Vakratund", description: "", quote: "" }).success).toBe(true);
    expect(pageSectionInputSchema.safeParse({ pageKey: "home", sectionKey: "estimator", isVisible: true, content: { eyebrow: "Project planning", title: "Explore an indicative estimate", description: "Final quotation follows site inspection.", ctaLabel: "Estimate a project" } }).success).toBe(true);
    expect(pageSectionInputSchema.safeParse({ pageKey: "home", sectionKey: "specialty", isVisible: true, content: { eyebrow: "Structural repairs", title: "Structural audit and repair for societies", description: "", ctaLabel: "Request Site Inspection", ctaHref: "/contact?type=inspection" } }).success).toBe(true);
  });
});
