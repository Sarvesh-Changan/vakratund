import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ServiceDetailPage } from "@/components/site/service-detail-page";
import { resolveSiteSettings } from "@/config/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPublicSettings } from "@/server/queries/settings";
import { getPublishedService, getPublishedServices } from "@/server/queries/services";
import { getPublishedServiceDetail } from "@/server/queries/service-detail";

export const revalidate = 3600;

type ServiceRouteProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const services = await getPublishedServices().catch(() => []);
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: ServiceRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getPublishedService(slug).catch(() => null);
  if (!service) return { title: "Service not found", robots: { index: false, follow: false } };

  return buildMetadata({
    path: `/services/${service.slug}`,
    fallbackTitle: service.title,
    fallbackDescription: service.shortDesc,
    entitySeo: service,
    ogImage: service.cover ? { url: service.cover.url, alt: service.cover.alt } : null,
  });
}

export default async function ServiceRoute({ params }: ServiceRouteProps) {
  const { slug } = await params;
  const detail = await getPublishedServiceDetail(slug).catch(() => null);
  if (!detail) notFound();
  const settings = resolveSiteSettings(await getPublicSettings().catch(() => null));
  return <ServiceDetailPage detail={detail} settings={settings} />;
}
