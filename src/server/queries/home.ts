import "server-only";

import { unstable_cache } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { resolveSiteSettings, type ResolvedSiteSettings } from "@/config/site";
import { prisma } from "@/lib/db/client";
import { pageSectionSchemas } from "@/lib/validation/pages";
import { getPublishedFaqs } from "@/server/queries/faqs";
import { getFeaturedGallery } from "@/server/queries/gallery";
import { getPublishedProjectCount, getPublishedProjects } from "@/server/queries/projects";
import { getPublicSettings } from "@/server/queries/settings";
import { getPublishedServices, type PublishedService } from "@/server/queries/services";
import { getVisibleTeamMembers } from "@/server/queries/team";
import { getPublishedTestimonials } from "@/server/queries/testimonials";

export type HomeHero = z.infer<typeof pageSectionSchemas.home.hero>;
export type HomeStats = z.infer<typeof pageSectionSchemas.home.stats>;
export type HomeServicesSection = z.infer<typeof pageSectionSchemas.home.services>;
export type HomeProjectsSection = z.infer<typeof pageSectionSchemas.home.projects>;
export type HomeWhySection = z.infer<typeof pageSectionSchemas.home.why>;
export type HomeProcess = z.infer<typeof pageSectionSchemas.home.process>;
export type HomeSpecialtySection = z.infer<typeof pageSectionSchemas.home.specialty>;
export type HomeFaqSection = z.infer<typeof pageSectionSchemas.home.faq>;
export type HomeEstimatorSection = z.infer<typeof pageSectionSchemas.home.estimator>;
export type HomeCta = z.infer<typeof pageSectionSchemas.home.cta>;

export type HomeHeroImage = { url: string; alt: string; width: number | null; height: number | null };

export type HomePageData = {
  settings: ResolvedSiteSettings;
  hero: HomeHero;
  heroVisible: boolean;
  heroImage: HomeHeroImage | null;
  stats: HomeStats | null;
  servicesSection: HomeServicesSection | null;
  servicesVisible: boolean;
  projectsSection: HomeProjectsSection;
  projectsVisible: boolean;
  whySection: HomeWhySection | null;
  whyVisible: boolean;
  process: HomeProcess | null;
  specialtySection: HomeSpecialtySection | null;
  specialtyVisible: boolean;
  faqSection: HomeFaqSection | null;
  faqVisible: boolean;
  estimatorSection: HomeEstimatorSection | null;
  estimatorVisible: boolean;
  cta: HomeCta | null;
  services: Awaited<ReturnType<typeof getPublishedServices>>;
  featuredProjects: Awaited<ReturnType<typeof getPublishedProjects>>;
  publishedProjectCount: number;
  featuredGallery: Awaited<ReturnType<typeof getFeaturedGallery>>;
  structuralService: PublishedService | null;
  testimonials: Awaited<ReturnType<typeof getPublishedTestimonials>>;
  faqs: Awaited<ReturnType<typeof getPublishedFaqs>>;
  team: Awaited<ReturnType<typeof getVisibleTeamMembers>>;
};

type JsonObject = { [key: string]: Prisma.JsonValue };

function asObject(value: Prisma.JsonValue): JsonObject | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as JsonObject : null;
}

export function normalizeHomeHero(value: Prisma.JsonValue, phone = ""): HomeHero | null {
  const object = asObject(value);
  if (!object) return null;
  const candidate = {
    ...object,
    primaryHref: typeof object.primaryHref === "string" && object.primaryHref.trim() ? object.primaryHref : "/estimate",
    secondaryHref: typeof object.secondaryHref === "string" && object.secondaryHref.trim() ? object.secondaryHref : phone ? `tel:${phone}` : "/contact",
    backgroundImageId: typeof object.backgroundImageId === "string" ? object.backgroundImageId : null,
  };
  const result = pageSectionSchemas.home.hero.safeParse(candidate);
  return result.success ? result.data : null;
}

function normalizeStats(value: Prisma.JsonValue): HomeStats | null {
  const result = pageSectionSchemas.home.stats.safeParse(value);
  return result.success ? result.data : null;
}

function normalizeHomeProjects(value: Prisma.JsonValue): HomeProjectsSection | null {
  const result = pageSectionSchemas.home.projects.safeParse(value);
  return result.success ? result.data : null;
}

function normalizeHomeServices(value: Prisma.JsonValue): HomeServicesSection | null {
  const result = pageSectionSchemas.home.services.safeParse(value);
  return result.success ? result.data : null;
}

function normalizeHomeWhy(value: Prisma.JsonValue): HomeWhySection | null {
  const result = pageSectionSchemas.home.why.safeParse(value);
  return result.success ? result.data : null;
}

function normalizeHomeSpecialty(value: Prisma.JsonValue): HomeSpecialtySection | null {
  const result = pageSectionSchemas.home.specialty.safeParse(value);
  return result.success ? result.data : null;
}

function normalizeHomeFaq(value: Prisma.JsonValue): HomeFaqSection | null {
  const result = pageSectionSchemas.home.faq.safeParse(value);
  return result.success ? result.data : null;
}

function normalizeHomeEstimator(value: Prisma.JsonValue): HomeEstimatorSection | null {
  const result = pageSectionSchemas.home.estimator.safeParse(value);
  return result.success ? result.data : null;
}

export function normalizeHomeProcess(value: Prisma.JsonValue): HomeProcess | null {
  const object = asObject(value);
  if (!object || typeof object.title !== "string" || !Array.isArray(object.steps)) return null;
  const steps = object.steps.flatMap((step) => {
    if (typeof step === "string") return [{ title: step, description: "" }];
    if (typeof step === "object" && step !== null && !Array.isArray(step) && typeof step.title === "string") return [{ title: step.title, description: typeof step.description === "string" ? step.description : "" }];
    return [];
  });
  const result = pageSectionSchemas.home.process.safeParse({ eyebrow: typeof object.eyebrow === "string" ? object.eyebrow : "", title: object.title, steps });
  return result.success ? result.data : null;
}

export function normalizeHomeCta(value: Prisma.JsonValue): HomeCta | null {
  const object = asObject(value);
  if (!object) return null;
  const result = pageSectionSchemas.home.cta.safeParse({ ...object, description: typeof object.description === "string" ? object.description : "", primaryHref: typeof object.primaryHref === "string" ? object.primaryHref : "/estimate", secondaryHref: typeof object.secondaryHref === "string" ? object.secondaryHref : "/contact?type=inspection" });
  return result.success ? result.data : null;
}

function fallbackHero(settings: ResolvedSiteSettings): HomeHero {
  const phone = settings.phones[0] ?? "";
  return { eyebrow: "Project Management Consultant & Turnkey Project Developers", title: "Building trust since 2003", description: "Civil engineering services for project management, repairs and rehabilitation of RCC structures, and construction of new buildings.", trustChips: ["MSME registered", "Insured workforce", "Since 2003"], primaryCta: "Get Free Quote", primaryHref: "/estimate", secondaryCta: "Call Now", secondaryHref: phone ? `tel:${phone}` : "/contact", backgroundImageId: null };
}

function fallbackProjectsSection(): HomeProjectsSection {
  return { eyebrow: "Featured work", title: "Selected projects", description: "", viewAllLabel: "View all projects" };
}

function fallbackHomePageData(): HomePageData {
  const settings = resolveSiteSettings(null);
  return { settings, hero: fallbackHero(settings), heroVisible: true, heroImage: null, stats: null, servicesSection: null, servicesVisible: false, projectsSection: fallbackProjectsSection(), projectsVisible: true, whySection: null, whyVisible: false, process: null, specialtySection: null, specialtyVisible: false, faqSection: null, faqVisible: false, estimatorSection: null, estimatorVisible: false, cta: null, services: [], featuredProjects: [], featuredGallery: [], publishedProjectCount: 0, structuralService: null, testimonials: [], faqs: [], team: [] };
}

async function readHomePageData(): Promise<HomePageData> {
  try {
    const [settingsRow, sections, services, featuredProjects, publishedProjectCount, featuredGallery, testimonials, faqs, team] = await Promise.all([
      getPublicSettings(),
      prisma.pageSection.findMany({ where: { pageKey: "home" }, orderBy: { sortOrder: "asc" }, select: { sectionKey: true, content: true, isVisible: true } }),
      getPublishedServices(),
      getPublishedProjects({ isFeatured: true }),
      getPublishedProjectCount(),
      getFeaturedGallery(),
      getPublishedTestimonials(),
      getPublishedFaqs(),
      getVisibleTeamMembers(),
    ]);
    const settings = resolveSiteSettings(settingsRow);
    const heroSection = sections.find((section) => section.sectionKey === "hero");
    const parsedHero = heroSection ? normalizeHomeHero(heroSection.content, settings.phones[0] ?? "") : null;
    const hero = parsedHero?.title?.trim() ? parsedHero : fallbackHero(settings);
    const statsSection = sections.find((section) => section.sectionKey === "stats");
    const servicesSection = sections.find((section) => section.sectionKey === "services");
    const projectsSection = sections.find((section) => section.sectionKey === "projects");
    const whySection = sections.find((section) => section.sectionKey === "why");
    const processSection = sections.find((section) => section.sectionKey === "process");
    const specialtySection = sections.find((section) => section.sectionKey === "specialty");
    const faqSection = sections.find((section) => section.sectionKey === "faq");
    const estimatorSection = sections.find((section) => section.sectionKey === "estimator");
    const ctaSection = sections.find((section) => section.sectionKey === "cta");
    const heroImage = hero.backgroundImageId ? await prisma.mediaAsset.findFirst({ where: { id: hero.backgroundImageId, kind: "IMAGE" }, select: { url: true, alt: true, width: true, height: true } }) : null;

    return {
      settings,
      hero,
      heroVisible: heroSection?.isVisible ?? true,
      heroImage,
      stats: statsSection?.isVisible ? normalizeStats(statsSection.content) : null,
      servicesSection: servicesSection?.isVisible ? normalizeHomeServices(servicesSection.content) : null,
      servicesVisible: servicesSection?.isVisible ?? false,
      projectsSection: projectsSection ? normalizeHomeProjects(projectsSection.content) ?? fallbackProjectsSection() : fallbackProjectsSection(),
      projectsVisible: projectsSection?.isVisible ?? true,
      whySection: whySection?.isVisible ? normalizeHomeWhy(whySection.content) : null,
      whyVisible: whySection?.isVisible ?? false,
      process: processSection?.isVisible ? normalizeHomeProcess(processSection.content) : null,
      specialtySection: specialtySection?.isVisible ? normalizeHomeSpecialty(specialtySection.content) : null,
      specialtyVisible: specialtySection?.isVisible ?? false,
      faqSection: faqSection?.isVisible ? normalizeHomeFaq(faqSection.content) : null,
      faqVisible: faqSection?.isVisible ?? false,
      estimatorSection: estimatorSection?.isVisible ? normalizeHomeEstimator(estimatorSection.content) : null,
      estimatorVisible: estimatorSection?.isVisible ?? false,
      cta: ctaSection?.isVisible ? normalizeHomeCta(ctaSection.content) : null,
      services,
      featuredProjects,
      publishedProjectCount,
      featuredGallery,
      structuralService: services.find((service) => service.slug === "structural-repairs-rehabilitation") ?? null,
      testimonials,
      faqs,
      team,
    };
  } catch (error) {
    if (process.env.NEXT_PHASE === "phase-production-build") return fallbackHomePageData();
    throw error;
  }
}

export const getHomePageData = unstable_cache(readHomePageData, ["home-page"], { tags: ["settings", "pages", "services", "projects", "gallery", "testimonials", "faqs", "team"], revalidate: 3600 });
