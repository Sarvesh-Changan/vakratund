import "server-only";

import { unstable_cache } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { resolveSiteSettings, type ResolvedSiteSettings } from "@/config/site";
import { prisma } from "@/lib/db/client";
import { pageSectionSchemas } from "@/lib/validation/pages";
import { getPublicPageSections } from "@/server/queries/pages";
import { getPublishedFaqs } from "@/server/queries/faqs";
import { getPublishedProjects } from "@/server/queries/projects";
import { getPublicSettings } from "@/server/queries/settings";
import { getPublishedServices, type PublishedService } from "@/server/queries/services";
import { getVisibleTeamMembers } from "@/server/queries/team";
import { getPublishedTestimonials } from "@/server/queries/testimonials";

export type HomeHero = z.infer<typeof pageSectionSchemas.home.hero>;
export type HomeStats = z.infer<typeof pageSectionSchemas.home.stats>;
export type HomeProcess = z.infer<typeof pageSectionSchemas.home.process>;
export type HomeCta = z.infer<typeof pageSectionSchemas.home.cta>;

export type HomeHeroImage = { url: string; alt: string; width: number | null; height: number | null };

export type HomePageData = {
  settings: ResolvedSiteSettings;
  hero: HomeHero;
  heroImage: HomeHeroImage | null;
  stats: HomeStats | null;
  process: HomeProcess | null;
  cta: HomeCta | null;
  services: Awaited<ReturnType<typeof getPublishedServices>>;
  featuredProjects: Awaited<ReturnType<typeof getPublishedProjects>>;
  structuralService: PublishedService | null;
  testimonials: Awaited<ReturnType<typeof getPublishedTestimonials>>;
  faqs: Awaited<ReturnType<typeof getPublishedFaqs>>;
  team: Awaited<ReturnType<typeof getVisibleTeamMembers>>;
};

type JsonObject = { [key: string]: Prisma.JsonValue };

function asObject(value: Prisma.JsonValue): JsonObject | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as JsonObject : null;
}

export function normalizeHomeHero(value: Prisma.JsonValue): HomeHero | null {
  const object = asObject(value);
  if (!object) return null;
  const candidate = {
    ...object,
    primaryHref: typeof object.primaryHref === "string" ? object.primaryHref : "/estimate",
    secondaryHref: typeof object.secondaryHref === "string" ? object.secondaryHref : "tel:+919821502956",
    backgroundImageId: typeof object.backgroundImageId === "string" ? object.backgroundImageId : null,
  };
  const result = pageSectionSchemas.home.hero.safeParse(candidate);
  return result.success ? result.data : null;
}

function normalizeStats(value: Prisma.JsonValue): HomeStats | null {
  const result = pageSectionSchemas.home.stats.safeParse(value);
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
  const result = pageSectionSchemas.home.process.safeParse({ title: object.title, steps });
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
  return { eyebrow: "Project Management Consultant & Turnkey Project Developers", title: `Building trust since ${settings.foundedYear}`, description: "Civil engineering services for project management, repairs and rehabilitation of RCC structures, and construction of new buildings.", primaryCta: "Get Free Quote", primaryHref: "/estimate", secondaryCta: "Call Now", secondaryHref: phone ? `tel:${phone}` : "/contact", backgroundImageId: null };
}

function fallbackCta(): HomeCta {
  return { title: "Quality is our first priority", description: "Talk to Vakratund Construction about your construction, repair or rehabilitation requirement.", primaryCta: "Get Free Quote", primaryHref: "/estimate", secondaryCta: "Request Site Inspection", secondaryHref: "/contact?type=inspection" };
}

function fallbackHomePageData(): HomePageData {
  const settings = resolveSiteSettings(null);
  return { settings, hero: fallbackHero(settings), heroImage: null, stats: null, process: null, cta: fallbackCta(), services: [], featuredProjects: [], structuralService: null, testimonials: [], faqs: [], team: [] };
}

async function readHomePageData(): Promise<HomePageData> {
  try {
    const [settingsRow, sections, services, featuredProjects, testimonials, faqs, team] = await Promise.all([
      getPublicSettings(),
      getPublicPageSections("home"),
      getPublishedServices(),
      getPublishedProjects({ isFeatured: true }),
      getPublishedTestimonials(),
      getPublishedFaqs(),
      getVisibleTeamMembers(),
    ]);
    const settings = resolveSiteSettings(settingsRow);
    const heroSection = sections.find((section) => section.sectionKey === "hero");
    const hero = heroSection ? normalizeHomeHero(heroSection.content) ?? fallbackHero(settings) : fallbackHero(settings);
    const statsSection = sections.find((section) => section.sectionKey === "stats");
    const processSection = sections.find((section) => section.sectionKey === "process");
    const ctaSection = sections.find((section) => section.sectionKey === "cta");
    const heroImage = hero.backgroundImageId ? await prisma.mediaAsset.findFirst({ where: { id: hero.backgroundImageId, kind: "IMAGE" }, select: { url: true, alt: true, width: true, height: true } }) : null;

    return { settings, hero, heroImage, stats: statsSection ? normalizeStats(statsSection.content) : null, process: processSection ? normalizeHomeProcess(processSection.content) : null, cta: ctaSection ? normalizeHomeCta(ctaSection.content) ?? fallbackCta() : fallbackCta(), services, featuredProjects, structuralService: services.find((service) => service.slug === "structural-repairs-rehabilitation") ?? null, testimonials, faqs, team };
  } catch (error) {
    if (process.env.NEXT_PHASE === "phase-production-build") return fallbackHomePageData();
    throw error;
  }
}

export const getHomePageData = unstable_cache(readHomePageData, ["home-page"], { tags: ["settings", "pages", "services", "projects", "testimonials", "faqs", "team"], revalidate: 3600 });
