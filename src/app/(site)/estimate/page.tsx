import type { Metadata } from "next";

import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui";
import { PageHero } from "@/components/site/page-hero";
import { EstimateFlow } from "@/components/site/estimate-flow";
import { buildMetadata } from "@/lib/seo/metadata";
import { getEstimatorConfigs } from "@/server/estimator/load-config";
import { getPublicSeo } from "@/server/queries/seo";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const pageSeo = await getPublicSeo("/estimate").catch(() => null);
  return buildMetadata({ path: "/estimate", fallbackTitle: "Get an Indicative Estimate", fallbackDescription: "Request an indicative project estimate. Final quotation follows site inspection.", pageSeo });
}

export default async function EstimatePage() {
  const configs = await getEstimatorConfigs();
  const breadcrumbs = [{ name: "Home", item: "/" }, { name: "Estimate", item: "/estimate" }] as const;
  return <><BreadcrumbJsonLd items={breadcrumbs} /><PageHero breadcrumbs={breadcrumbs.map((item) => ({ label: item.name, href: item.item }))} eyebrow="Project planning" title="Get an indicative estimate" description="Share your project details for a database-driven range. Final quotation follows site inspection." /><Container className="section-space"><EstimateFlow configs={configs} /></Container></>;
}
