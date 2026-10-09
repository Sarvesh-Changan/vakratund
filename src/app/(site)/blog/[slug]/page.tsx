import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogArticlePage } from "@/components/site/blog-article-page";
import { resolveSiteSettings } from "@/config/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPublishedBlogPost, getPublishedBlogPosts } from "@/server/queries/blog";
import { getPublicSettings } from "@/server/queries/settings";

export const revalidate = 60;
type BlogArticleRouteProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = await getPublishedBlogPosts().catch(() => []);
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogArticleRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPost(slug).catch(() => null);
  if (!post) return { title: "Article not found", robots: { index: false, follow: false } };
  return buildMetadata({ path: `/blog/${post.slug}`, fallbackTitle: post.title, fallbackDescription: post.excerpt, entitySeo: post, ogImage: post.cover ? { url: post.cover.url, alt: post.cover.alt } : null });
}

export default async function BlogArticleRoute({ params }: BlogArticleRouteProps) {
  const { slug } = await params;
  const post = await getPublishedBlogPost(slug).catch(() => null);
  if (!post) notFound();
  const [relatedPosts, settings] = await Promise.all([
    getPublishedBlogPosts(post.category?.slug).then((posts) => posts.filter((item) => item.slug !== post.slug).slice(0, 3)).catch(() => []),
    getPublicSettings().catch(() => null),
  ]);
  return <BlogArticlePage post={post} relatedPosts={relatedPosts} settings={resolveSiteSettings(settings)} />;
}
