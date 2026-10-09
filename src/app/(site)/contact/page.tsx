import type { Metadata } from "next";

import { ContactPage } from "@/components/site/contact-page";
import { resolveSiteSettings } from "@/config/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { sanitizeProjectPrefill, sanitizeProjectSlug } from "@/lib/validation/contact";
import { getPublicSettings } from "@/server/queries/settings";
import { getPublicSeo } from "@/server/queries/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const pageSeo = await getPublicSeo("/contact").catch(() => null);
  return buildMetadata({ path: "/contact", fallbackTitle: "Contact Vakratund Construction", fallbackDescription: "Talk to Vakratund Construction about construction, PMC, repair, rehabilitation and waterproofing requirements.", pageSeo });
}

export default async function ContactRoute({ searchParams }: { searchParams: Promise<{ project?: string | string[]; projectSlug?: string | string[] }> }) {
  const [settings, params] = await Promise.all([getPublicSettings().catch(() => null), searchParams]);
  return <ContactPage settings={resolveSiteSettings(settings)} projectPrefill={sanitizeProjectPrefill(params.project)} projectSlug={sanitizeProjectSlug(params.projectSlug)} />;
}
