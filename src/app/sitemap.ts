import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/metadata";
import { getPublicSitemapEntries } from "@/server/queries/sitemap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getPublicSitemapEntries();
  return entries.map((entry) => ({ url: absoluteUrl(entry.path), lastModified: entry.lastModified, changeFrequency: "monthly" as const, priority: entry.path === "/" ? 1 : 0.7 }));
}
