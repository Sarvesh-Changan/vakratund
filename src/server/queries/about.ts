import "server-only";

import { unstable_cache } from "next/cache";
import { resolveSiteSettings, type ResolvedSiteSettings } from "@/config/site";
import { pageSectionSchemas } from "@/lib/validation/pages";
import { getPublicPageSections } from "@/server/queries/pages";
import { getPublicSettings } from "@/server/queries/settings";
import { getVisibleTeamMembers, type PublishedTeamMember } from "@/server/queries/team";
import { getPublishedTestimonials, type PublishedTestimonial } from "@/server/queries/testimonials";
import { getPublishedServices } from "@/server/queries/services";
import { getFeaturedGallery, type PublishedGalleryItem } from "@/server/queries/gallery";

export type AboutSection = { title: string; body: string };
export type AboutJourney = { eyebrow?: string; title: string; milestones: { year: number; title: string; description?: string }[] };
export type AboutPageData = {
  settings: ResolvedSiteSettings;
  story: AboutSection | null;
  mission: AboutSection | null;
  journey: AboutJourney | null;
  aboutImage: PublishedGalleryItem | null;
  serviceCount: number;
  team: PublishedTeamMember[];
  testimonials: PublishedTestimonial[];
};

function sectionContent(sections: Awaited<ReturnType<typeof getPublicPageSections>>, key: "story" | "mission"): AboutSection | null {
  const section = sections.find((item) => item.sectionKey === key);
  if (!section) return null;
  const parsed = pageSectionSchemas.about[key].safeParse(section.content);
  return parsed.success ? parsed.data : null;
}

function journeyContent(sections: Awaited<ReturnType<typeof getPublicPageSections>>): AboutJourney | null {
  const section = sections.find((item) => item.sectionKey === "journey");
  if (!section) return null;
  const parsed = pageSectionSchemas.about.journey.safeParse(section.content);
  return parsed.success ? parsed.data : null;
}

export function emptyAboutPageData(): AboutPageData {
  return { settings: resolveSiteSettings(null), story: null, mission: null, journey: null, aboutImage: null, serviceCount: 0, team: [], testimonials: [] };
}

async function readAboutPageData(): Promise<AboutPageData> {
  const [settings, sections, team, testimonials, services, gallery] = await Promise.all([
    getPublicSettings(),
    getPublicPageSections("about"),
    getVisibleTeamMembers(),
    getPublishedTestimonials(),
    getPublishedServices(),
    getFeaturedGallery(),
  ]);
  return { settings: resolveSiteSettings(settings), story: sectionContent(sections, "story"), mission: sectionContent(sections, "mission"), journey: journeyContent(sections), aboutImage: gallery.find((item) => item.mediaType === "IMAGE") ?? null, serviceCount: services.length, team, testimonials };
}

export const getAboutPageData = unstable_cache(readAboutPageData, ["about-page"], { tags: ["pages", "settings", "team", "testimonials", "services", "gallery"], revalidate: 3600 });
