import type { Metadata } from "next";

import { Container } from "@/components/ui";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
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
  return <><BreadcrumbJsonLd items={breadcrumbs} /><Container className="py-12 sm:py-16 lg:py-20"><Breadcrumbs items={breadcrumbs.map((item) => ({ label: item.name, href: item.item }))} /><h1 className="mt-8 font-heading text-4xl font-bold sm:text-5xl">Get an indicative estimate</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-ink-muted">Share your project details for a database-driven range. Final quotation follows site inspection.</p><div className="mt-10"><EstimateFlow configs={configs} /></div></Container></>;
}
