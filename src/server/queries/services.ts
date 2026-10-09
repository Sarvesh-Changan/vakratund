import "server-only";

import { unstable_cache } from "next/cache";

import type { PricingMode } from "@/generated/prisma/client";
import { localLandingSlugs } from "@/config/seo-landings";
import { prisma } from "@/lib/db/client";

export type PublishedService = {
  id: string;
  slug: string;
  title: string;
  shortDesc: string;
  description: string;
  scopeItems: string[];
  iconKey: string | null;
  isFeatured: boolean;
  sortOrder: number;
  seoTitle: string | null;
  seoDesc: string | null;
  pricingMode: PricingMode | null;
  cover: { id: string; url: string; alt: string; width: number | null; height: number | null } | null;
};

const publicServiceSelect = {
  id: true,
  slug: true,
  title: true,
  shortDesc: true,
  description: true,
  scopeItems: true,
  iconKey: true,
  coverId: true,
  isFeatured: true,
  sortOrder: true,
  seoTitle: true,
  seoDesc: true,
} as const;

async function readPublishedServices(): Promise<PublishedService[]> {
  const rows = await prisma.service.findMany({ where: { status: "PUBLISHED", slug: { notIn: [...localLandingSlugs] } }, orderBy: [{ sortOrder: "asc" }, { title: "asc" }], select: publicServiceSelect });
  const coverIds = rows.flatMap((row) => row.coverId ? [row.coverId] : []);
  const media = await prisma.mediaAsset.findMany({ where: { id: { in: coverIds } }, select: { id: true, url: true, alt: true, width: true, height: true } });
  const mediaById = new Map(media.map((asset) => [asset.id, asset]));
  const estimators = await prisma.estimatorService.findMany({ where: { serviceId: { in: rows.map((row) => row.id) } }, select: { serviceId: true, pricingMode: true } });
  const pricingModeByServiceId = new Map(estimators.flatMap((estimator) => estimator.serviceId ? [[estimator.serviceId, estimator.pricingMode] as const] : []));
  return rows.map(({ coverId, ...row }) => ({ ...row, pricingMode: pricingModeByServiceId.get(row.id) ?? null, cover: coverId ? mediaById.get(coverId) ?? null : null }));
}

export const getPublishedServices = unstable_cache(readPublishedServices, ["published-services"], { tags: ["services"], revalidate: 3600 });

async function readPublishedService(slug: string): Promise<PublishedService | null> {
  const row = await prisma.service.findFirst({ where: { slug, status: "PUBLISHED" }, select: publicServiceSelect });
  if (!row) return null;
  const { coverId, ...service } = row;
  const cover = coverId ? await prisma.mediaAsset.findUnique({ where: { id: coverId }, select: { id: true, url: true, alt: true, width: true, height: true } }) : null;
  const estimator = await prisma.estimatorService.findFirst({ where: { serviceId: row.id }, select: { pricingMode: true } });
  return { ...service, pricingMode: estimator?.pricingMode ?? null, cover };
}

export function getPublishedService(slug: string): Promise<PublishedService | null> {
  return unstable_cache(() => readPublishedService(slug), ["published-service", slug], { tags: ["services", `service:${slug}`], revalidate: 3600 })();
}
