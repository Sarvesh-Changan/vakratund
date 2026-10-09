import type { Metadata } from "next";

import { ServicesPage } from "@/components/site/services-page";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPublishedServices } from "@/server/queries/services";
import { getPublicSeo } from "@/server/queries/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const pageSeo = await getPublicSeo("/services").catch(() => null);
  return buildMetadata({
    path: "/services",
    fallbackTitle: "Civil Engineering Services",
    fallbackDescription: "Explore construction, project management, structural repair, rehabilitation and maintenance services from Vakratund Construction.",
    pageSeo,
  });
}

export default async function ServicesRoute() {
  const services = await getPublishedServices().catch(() => []);
  return <ServicesPage services={services} />;
}
