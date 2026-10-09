import type { Metadata } from "next";

import { LegalPage } from "@/components/site/legal-page";
import { defaultPrivacyMarkdown } from "@/lib/legal/defaults";
import { buildMetadata } from "@/lib/seo/metadata";
import { pageSectionSchemas } from "@/lib/validation/pages";
import { getPublicPageSections } from "@/server/queries/pages";
import { getPublicSeo } from "@/server/queries/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const pageSeo = await getPublicSeo("/privacy").catch(() => null);
  return buildMetadata({ path: "/privacy", fallbackTitle: "Privacy Policy", fallbackDescription: "Read how Vakratund Construction handles enquiry information and privacy requests.", pageSeo });
}

export default async function PrivacyRoute() {
  const sections = await getPublicPageSections("legal").catch(() => []);
  const section = sections.find((item) => item.sectionKey === "privacy");
  const parsed = section ? pageSectionSchemas.legal.privacy.safeParse(section.content) : null;
  const content = parsed?.success ? parsed.data.body : defaultPrivacyMarkdown;
  return <LegalPage title="Privacy Policy" eyebrow="Privacy" content={content} breadcrumbs={[{ name: "Home", item: "/" }, { name: "Privacy Policy", item: "/privacy" }]} />;
}
