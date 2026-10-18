import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/client";
import { SEO_PATHS } from "@/lib/validation/seo";

export type PublicSitemapEntry = { path: string; lastModified: Date };

async function readPublicSitemapEntries(): Promise<PublicSitemapEntry[]> {
  const now = new Date();
  const [pageSeo, services, projects] = await Promise.all([
    prisma.pageSeo.findMany({ where: { path: { in: [...SEO_PATHS] } }, select: { path: true, noIndex: true, updatedAt: true } }),
    prisma.service.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    prisma.project.findMany({ where: { publishStatus: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
  ]);

  const seoByPath = new Map(pageSeo.map((item) => [item.path, item]));
  const staticEntries = SEO_PATHS.flatMap((path) => {
    const seo = seoByPath.get(path);
    return seo?.noIndex ? [] : [{ path, lastModified: seo?.updatedAt ?? now }];
  });

  return [
    ...staticEntries,
    ...services.map((service) => ({ path: `/services/${service.slug}`, lastModified: service.updatedAt })),
    ...projects.map((project) => ({ path: `/projects/${project.slug}`, lastModified: project.updatedAt })),
  ];
}

export const getPublicSitemapEntries = unstable_cache(readPublicSitemapEntries, ["public-sitemap"], { tags: ["seo", "services", "projects"], revalidate: 3600 });
