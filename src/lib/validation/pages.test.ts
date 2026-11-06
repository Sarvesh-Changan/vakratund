import { describe, expect, it } from "vitest";
import { pageSectionInputSchema, pageSectionSchemas } from "./pages";

describe("homepage PageSection content", () => {
  it("validates showcase slider section settings with defaults and speed options", () => {
    expect(pageSectionSchemas.home.showcase.safeParse({ speed: "normal", pauseOnHover: true }).success).toBe(true);
    expect(pageSectionSchemas.home.showcase.safeParse({ eyebrow: "Gallery", heading: "Our Site Work", speed: "fast", pauseOnHover: false }).success).toBe(true);
    expect(pageSectionSchemas.home.showcase.safeParse({ speed: "lightning" }).success).toBe(false);
  });

  it("keeps legacy About story content valid and validates an optional image alt", () => {
    expect(pageSectionSchemas.about.story.safeParse({ title: "Our story", body: "Since 2003." }).success).toBe(true);
    expect(pageSectionSchemas.about.story.safeParse({ title: "Our story", body: "Since 2003.", imageMediaId: "cmj4media00000000000000001", imageAlt: "Construction work" }).success).toBe(true);
    expect(pageSectionSchemas.about.story.safeParse({ title: "Our story", body: "Since 2003.", imageMediaId: "cmj4media00000000000000001", imageAlt: "" }).success).toBe(false);
  });

  it("accepts showcase slider section in pageSectionInputSchema", () => {
    expect(pageSectionInputSchema.safeParse({ pageKey: "home", sectionKey: "showcase", isVisible: true, content: { eyebrow: "", heading: "", speed: "slow", pauseOnHover: true } }).success).toBe(true);
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

  it("validates editable about expertise section with three content blocks", () => {
    const validExpertise = {
      eyebrow: "Our aim and values",
      title: "Genuine engineering solutions and repair expertise",
      description: "Dedicated civil engineering solutions.",
      blocks: [
        { title: "Genuine engineering solutions", description: "Civil engineering services and solutions." },
        { title: "Repair-led expertise", description: "Repairs and rehabilitation of RCC structures." },
        { title: "Working in tandem", description: "Working in tandem with consultants and clients." },
      ],
    };
    expect(pageSectionSchemas.about.expertise.safeParse(validExpertise).success).toBe(true);
    expect(pageSectionInputSchema.safeParse({ pageKey: "about", sectionKey: "expertise", isVisible: true, content: validExpertise }).success).toBe(true);
    expect(pageSectionSchemas.about.expertise.safeParse({ blocks: [] }).success).toBe(false);
  });

  it("validates editable about credentials section with MSME and insurance items", () => {
    const validCredentials = {
      eyebrow: "Credentials",
      title: "Registered and responsibly covered",
      description: "Credentials and statutory registrations.",
      items: [
        { id: "msme", label: "MSME registration", value: "Registered with MSME", mediaId: null, mediaUrl: "/udyam.png", alt: "Udyam logo", isVisible: true },
        { id: "workmen_insurance", label: "Workmen's compensation insurance", value: "Covered by policy", mediaId: null, mediaUrl: null, alt: "Insurance", isVisible: true },
      ],
    };
    expect(pageSectionSchemas.about.credentials.safeParse(validCredentials).success).toBe(true);
    expect(pageSectionInputSchema.safeParse({ pageKey: "about", sectionKey: "credentials", isVisible: true, content: validCredentials }).success).toBe(true);
  });
});
