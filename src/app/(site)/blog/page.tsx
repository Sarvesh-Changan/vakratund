import type { Metadata } from "next";

import { BlogIndexPage } from "@/components/site/blog-index-page";
import { buildMetadata } from "@/lib/seo/metadata";
import { parseBlogSearchParams, type PublicBlogSearchParams } from "@/lib/validation/public-blog";
import { getPublishedBlogCategories, getPublishedBlogPostsPage } from "@/server/queries/blog";
import { getPublicSeo } from "@/server/queries/seo";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const pageSeo = await getPublicSeo("/blog").catch(() => null);
  return buildMetadata({ path: "/blog", fallbackTitle: "Construction Insights", fallbackDescription: "Insights on construction, structural repairs, project management and waterproofing.", pageSeo });
}

export default async function BlogRoute({ searchParams }: { searchParams: Promise<PublicBlogSearchParams> }) {
  const parsed = parseBlogSearchParams(await searchParams);
  const [result, categories] = await Promise.all([getPublishedBlogPostsPage(parsed.categorySlug, parsed.page, 9).catch(() => ({ items: [], page: 1, pageSize: 9, total: 0, pageCount: 1 })), getPublishedBlogCategories().catch(() => [])]);
  return <BlogIndexPage result={result} categories={categories} categorySlug={parsed.categorySlug} />;
}
