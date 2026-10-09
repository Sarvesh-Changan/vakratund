import type { Metadata } from "next";

import { AboutPage } from "@/components/site/about-page";
import { buildMetadata } from "@/lib/seo/metadata";
import { emptyAboutPageData, getAboutPageData } from "@/server/queries/about";
import { getPublicSeo } from "@/server/queries/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const pageSeo = await getPublicSeo("/about").catch(() => null);
  return buildMetadata({ path: "/about", fallbackTitle: "About Vakratund Construction", fallbackDescription: "Learn about Vakratund Construction's civil engineering, repair and rehabilitation experience.", pageSeo });
}

export default async function AboutRoute() {
  const data = await getAboutPageData().catch(() => emptyAboutPageData());
  return <AboutPage data={data} />;
}
