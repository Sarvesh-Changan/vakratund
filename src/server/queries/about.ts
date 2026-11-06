import "server-only";

import { unstable_cache } from "next/cache";
import { resolveSiteSettings, type ResolvedSiteSettings } from "@/config/site";
import { pageSectionSchemas } from "@/lib/validation/pages";
import { getPublicSettings } from "@/server/queries/settings";
import { getVisibleTeamMembers, type PublishedTeamMember } from "@/server/queries/team";
import { getPublishedTestimonials, type PublishedTestimonial } from "@/server/queries/testimonials";
import { getPublishedServices } from "@/server/queries/services";
import { prisma } from "@/lib/db/client";

export type AboutSection = {
  title: string;
  body: string;
  imageMediaId?: string | null;
  imageAlt?: string;
  imageCaption?: string;
  image?: { url: string; alt: string; width: number | null; height: number | null } | null;
};

export type AboutJourney = {
  eyebrow?: string;
  title: string;
  milestones: { year: number; title: string; description?: string }[];
};

export type AboutExpertiseBlock = {
  title: string;
  description: string;
};

export type AboutExpertise = {
  eyebrow?: string;
  title?: string;
  description?: string;
  blocks: AboutExpertiseBlock[];
};

export type AboutCredentialItem = {
  id: string;
  label: string;
  value?: string;
  mediaId?: string | null;
  mediaUrl?: string | null;
  alt?: string;
  isVisible: boolean;
  image?: { url: string; alt: string; width: number | null; height: number | null } | null;
};

export type AboutCredentials = {
  eyebrow?: string;
  title?: string;
  description?: string;
  items: AboutCredentialItem[];
};

export type AboutPageData = {
  settings: ResolvedSiteSettings;
  story: AboutSection | null;
  mission: AboutSection | null;
  journey: AboutJourney | null;
  expertise: AboutExpertise | null;
  expertiseVisible: boolean;
  credentialsData: AboutCredentials | null;
  credentialsVisible: boolean;
  serviceCount: number;
  team: PublishedTeamMember[];
  testimonials: PublishedTestimonial[];
};

type PageSectionRecord = {
  sectionKey: string;
  content: unknown;
  isVisible: boolean;
};

function sectionContent(
  sections: PageSectionRecord[],
  key: "story" | "mission",
): AboutSection | null {
  const section = sections.find((item) => item.sectionKey === key);
  if (!section || !section.isVisible) return null;
  const parsed = pageSectionSchemas.about[key].safeParse(section.content);
  return parsed.success ? parsed.data : null;
}

function journeyContent(
  sections: PageSectionRecord[],
): AboutJourney | null {
  const section = sections.find((item) => item.sectionKey === "journey");
  if (!section || !section.isVisible) return null;
  const parsed = pageSectionSchemas.about.journey.safeParse(section.content);
  return parsed.success ? parsed.data : null;
}

export function emptyAboutPageData(): AboutPageData {
  return {
    settings: resolveSiteSettings(null),
    story: null,
    mission: null,
    journey: null,
    expertise: null,
    expertiseVisible: true,
    credentialsData: null,
    credentialsVisible: true,
    serviceCount: 0,
    team: [],
    testimonials: [],
  };
}

async function readAboutPageData(): Promise<AboutPageData> {
  const [settings, sections, team, testimonials, services] = await Promise.all([
    getPublicSettings(),
    prisma.pageSection.findMany({
      where: { pageKey: "about" },
      select: { sectionKey: true, content: true, isVisible: true },
    }),
    getVisibleTeamMembers(),
    getPublishedTestimonials(),
    getPublishedServices(),
  ]);

  const story = sectionContent(sections, "story");
  const storyAsset = story?.imageMediaId
    ? await prisma.mediaAsset.findUnique({
        where: { id: story.imageMediaId },
        select: { url: true, alt: true, width: true, height: true },
      })
    : null;

  // Expertise Section
  const expertiseSection = sections.find((item) => item.sectionKey === "expertise");
  let expertise: AboutExpertise | null = null;
  let expertiseVisible = true;
  if (expertiseSection) {
    expertiseVisible = expertiseSection.isVisible;
    const parsed = pageSectionSchemas.about.expertise.safeParse(expertiseSection.content);
    if (parsed.success) {
      expertise = parsed.data;
    }
  }
  if (!expertise) {
    expertise = {
      eyebrow: "Our aim and values",
      title: "Genuine engineering solutions and repair expertise",
      description:
        "Dedicated civil engineering and structural rehabilitation services for corporate offices and housing societies.",
      blocks: [
        {
          title: "Genuine engineering solutions",
          description:
            "Civil engineering services and solutions for corporate offices and co-operative housing societies.",
        },
        {
          title: "Repair-led expertise",
          description:
            "Repairs and rehabilitation of RCC structures, including structural strengthening.",
        },
        {
          title: "Working in tandem",
          description:
            "Working in tandem with consultants and clients while executing jobs of varying magnitude.",
        },
      ],
    };
  }

  // Credentials Section
  const credentialsSection = sections.find((item) => item.sectionKey === "credentials");
  let credentialsData: AboutCredentials | null = null;
  let credentialsVisible = true;
  if (credentialsSection) {
    credentialsVisible = credentialsSection.isVisible;
    const parsed = pageSectionSchemas.about.credentials.safeParse(credentialsSection.content);
    if (parsed.success) {
      credentialsData = parsed.data;
    }
  }
  if (!credentialsData) {
    credentialsData = {
      eyebrow: "Credentials",
      title: "Registered and responsibly covered",
      description: "Official statutory registrations and insurance coverage.",
      items: [
        {
          id: "msme",
          label: "MSME registration",
          value: "Registered with MSME, Government of India",
          mediaId: null,
          mediaUrl: "/udyam.png",
          alt: "Udyam MSME Registration",
          isVisible: true,
        },
        {
          id: "workmen_insurance",
          label: "Workmen's compensation insurance",
          value:
            "Covered by workmen's compensation insurance policy under the Maharashtra Government Act of Labour Insurance",
          mediaId: null,
          mediaUrl: null,
          alt: "Workmen's Compensation Insurance",
          isVisible: true,
        },
      ],
    };
  }

  const credentialMediaIds = credentialsData.items
    .map((item) => item.mediaId)
    .filter((id): id is string => Boolean(id));

  const credentialAssets =
    credentialMediaIds.length > 0
      ? await prisma.mediaAsset.findMany({
          where: { id: { in: credentialMediaIds } },
          select: { id: true, url: true, alt: true, width: true, height: true },
        })
      : [];
  const credentialAssetMap = new Map(credentialAssets.map((a) => [a.id, a]));

  const resolvedCredentialItems: AboutCredentialItem[] = credentialsData.items.map((item) => {
    const asset = item.mediaId ? credentialAssetMap.get(item.mediaId) : null;
    return {
      ...item,
      image: asset
        ? {
            url: asset.url,
            alt: item.alt || asset.alt,
            width: asset.width,
            height: asset.height,
          }
        : item.mediaUrl
          ? {
              url: item.mediaUrl,
              alt: item.alt || item.label,
              width: null,
              height: null,
            }
          : null,
    };
  });

  return {
    settings: resolveSiteSettings(settings),
    story: story
      ? {
          ...story,
          image: storyAsset ? { ...storyAsset, alt: story.imageAlt || storyAsset.alt } : null,
        }
      : null,
    mission: sectionContent(sections, "mission"),
    journey: journeyContent(sections),
    expertise,
    expertiseVisible,
    credentialsData: {
      ...credentialsData,
      items: resolvedCredentialItems,
    },
    credentialsVisible,
    serviceCount: services.length,
    team,
    testimonials,
  };
}

export const getAboutPageData = unstable_cache(readAboutPageData, ["about-page"], {
  tags: ["pages", "settings", "team", "testimonials", "services", "gallery"],
  revalidate: 3600,
});
