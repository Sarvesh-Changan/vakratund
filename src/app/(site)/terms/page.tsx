import type { Metadata } from "next";

import { LegalPage } from "@/components/site/legal-page";
import { defaultTermsMarkdown } from "@/lib/legal/defaults";
import { buildMetadata } from "@/lib/seo/metadata";
import { pageSectionSchemas } from "@/lib/validation/pages";
import { getPublicPageSections } from "@/server/queries/pages";
import { getPublicSeo } from "@/server/queries/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const pageSeo = await getPublicSeo("/terms").catch(() => null);
  return buildMetadata({ path: "/terms", fallbackTitle: "Terms of Use", fallbackDescription: "Read the terms for using the Vakratund Construction website and project enquiries.", pageSeo });
}

export default async function TermsRoute() {
  const sections = await getPublicPageSections("legal").catch(() => []);
  const section = sections.find((item) => item.sectionKey === "terms");
  const parsed = section ? pageSectionSchemas.legal.terms.safeParse(section.content) : null;
  const content = parsed?.success ? parsed.data.body : defaultTermsMarkdown;
  return <LegalPage title="Terms of Use" eyebrow="Terms" content={content} breadcrumbs={[{ name: "Home", item: "/" }, { name: "Terms of Use", item: "/terms" }]} />;
}
