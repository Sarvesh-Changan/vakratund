import type { Metadata } from "next";

import { FaqsPage } from "@/components/site/faqs-page";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPublishedFaqs } from "@/server/queries/faqs";
import { getPublicSeo } from "@/server/queries/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const pageSeo = await getPublicSeo("/faqs").catch(() => null);
  return buildMetadata({ path: "/faqs", fallbackTitle: "Frequently Asked Questions", fallbackDescription: "Answers about Vakratund Construction services and project enquiries.", pageSeo });
}

export default async function FaqsRoute() {
  const faqs = await getPublishedFaqs().catch(() => []);
  return <FaqsPage faqs={faqs} />;
}
