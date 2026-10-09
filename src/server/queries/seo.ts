import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/client";

export type PublicPageSeo = {
  path: string;
  title: string | null;
  description: string | null;
  ogImageId: string | null;
  ogImage: { url: string; alt: string } | null;
  canonical: string | null;
  noIndex: boolean;
};

async function readPublicSeo(path: string): Promise<PublicPageSeo | null> {
  const row = await prisma.pageSeo.findUnique({ where: { path }, select: { path: true, title: true, description: true, ogImageId: true, canonical: true, noIndex: true } });
  if (!row) return null;
  const ogImage = row.ogImageId ? await prisma.mediaAsset.findUnique({ where: { id: row.ogImageId }, select: { url: true, alt: true } }) : null;
  return { ...row, ogImage };
}

export function getPublicSeo(path: string): Promise<PublicPageSeo | null> {
  return unstable_cache(() => readPublicSeo(path), ["page-seo", path], { tags: ["seo"], revalidate: 3600 })();
}
