import "server-only";

import { unstable_cache } from "next/cache";
import { resolveSiteSettings, type ResolvedSiteSettings } from "@/config/site";
import { pageSectionSchemas } from "@/lib/validation/pages";
import { getPublicPageSections } from "@/server/queries/pages";
import { getPublicSettings } from "@/server/queries/settings";
import { getVisibleTeamMembers, type PublishedTeamMember } from "@/server/queries/team";
import { getPublishedTestimonials, type PublishedTestimonial } from "@/server/queries/testimonials";

export type AboutSection = { title: string; body: string };
export type AboutPageData = {
  settings: ResolvedSiteSettings;
  story: AboutSection | null;
  mission: AboutSection | null;
  team: PublishedTeamMember[];
  testimonials: PublishedTestimonial[];
};

function sectionContent(sections: Awaited<ReturnType<typeof getPublicPageSections>>, key: "story" | "mission"): AboutSection | null {
  const section = sections.find((item) => item.sectionKey === key);
  if (!section) return null;
  const parsed = pageSectionSchemas.about[key].safeParse(section.content);
  return parsed.success ? parsed.data : null;
}

export function emptyAboutPageData(): AboutPageData {
  return { settings: resolveSiteSettings(null), story: null, mission: null, team: [], testimonials: [] };
}

async function readAboutPageData(): Promise<AboutPageData> {
  const [settings, sections, team, testimonials] = await Promise.all([
    getPublicSettings(),
    getPublicPageSections("about"),
    getVisibleTeamMembers(),
    getPublishedTestimonials(),
  ]);
  return { settings: resolveSiteSettings(settings), story: sectionContent(sections, "story"), mission: sectionContent(sections, "mission"), team, testimonials };
}

export const getAboutPageData = unstable_cache(readAboutPageData, ["about-page"], { tags: ["pages", "settings", "team", "testimonials"], revalidate: 3600 });
