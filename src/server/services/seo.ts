import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";
import { SEO_PATHS, type PageSeoInput } from "@/lib/validation/seo";
import { logActivity } from "@/server/services/activity";

export type PageSeoView = { id: string; path: string; title: string | null; description: string | null; ogImageId: string | null; canonical: string | null; noIndex: boolean; ogImage: { id: string; url: string; alt: string } | null; updatedAt: string };
const seoSelect = { id: true, path: true, title: true, description: true, ogImageId: true, canonical: true, noIndex: true, updatedAt: true } satisfies Prisma.PageSeoSelect;
type SeoRecord = Prisma.PageSeoGetPayload<{ select: typeof seoSelect }>;
async function toView(row: SeoRecord): Promise<PageSeoView> {
  const ogImage = row.ogImageId ? await prisma.mediaAsset.findUnique({ where: { id: row.ogImageId }, select: { id: true, url: true, alt: true } }) : null;
  return { ...row, ogImage, updatedAt: row.updatedAt.toISOString() };
}

export async function listPageSeo(): Promise<PageSeoView[]> {
  const rows = await prisma.pageSeo.findMany({ where: { path: { in: [...SEO_PATHS] } }, orderBy: { path: "asc" }, select: seoSelect });
  const byPath = new Map(rows.map((row) => [row.path, row]));
  return Promise.all(SEO_PATHS.map((path) => byPath.get(path)).filter((row): row is SeoRecord => Boolean(row)).map(toView));
}

export async function savePageSeo(input: PageSeoInput, userId: string): Promise<PageSeoView> {
  if (input.ogImageId) {
    const image = await prisma.mediaAsset.findUnique({ where: { id: input.ogImageId }, select: { kind: true } });
    if (!image || image.kind !== "IMAGE") throw new Error("The SEO image must reference an image media asset.");
  }
  const row = await prisma.pageSeo.upsert({ where: { path: input.path }, create: { path: input.path, title: input.title || null, description: input.description || null, ogImageId: input.ogImageId, canonical: input.canonical || null, noIndex: input.noIndex }, update: { title: input.title || null, description: input.description || null, ogImageId: input.ogImageId, canonical: input.canonical || null, noIndex: input.noIndex }, select: seoSelect });
  await logActivity({ userId, action: "seo.save", entityType: "PageSeo", entityId: row.id, summary: `Saved SEO metadata for ${row.path}`, diff: { path: row.path, noIndex: row.noIndex, hasOgImage: Boolean(row.ogImageId), hasCanonical: Boolean(row.canonical) } });
  return toView(row);
}
