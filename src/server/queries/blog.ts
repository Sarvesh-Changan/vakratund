import "server-only";

import { unstable_cache } from "next/cache";

import type { Prisma, PublishStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";

export type PublishedBlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover: { id: string; url: string; alt: string; width: number | null; height: number | null } | null;
  category: { id: string; name: string; slug: string } | null;
  author: { id: string; name: string } | null;
  publishedAt: string;
  readingMins: number;
  seoTitle: string | null;
  seoDesc: string | null;
};

export type PublishedBlogCategory = { id: string; name: string; slug: string };
export type PublishedBlogPostsPage = { items: PublishedBlogPost[]; page: number; pageSize: number; total: number; pageCount: number };

const publicPostSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  content: true,
  coverId: true,
  category: { select: { id: true, name: true, slug: true } },
  author: { select: { id: true, name: true } },
  publishedAt: true,
  readingMins: true,
  seoTitle: true,
  seoDesc: true,
} satisfies Prisma.BlogPostSelect;

type PublicPostRecord = Prisma.BlogPostGetPayload<{ select: typeof publicPostSelect }>;

export function isBlogPostPublic(status: PublishStatus, publishedAt: Date | null, now: Date): boolean {
  return status === "PUBLISHED" && publishedAt !== null && publishedAt.getTime() <= now.getTime();
}

export function publishedBlogWhere(now: Date): Prisma.BlogPostWhereInput {
  return { status: "PUBLISHED", publishedAt: { not: null, lte: now } };
}

async function coverMap(rows: readonly PublicPostRecord[]): Promise<Map<string, PublishedBlogPost["cover"]>> {
  const ids = [...new Set(rows.flatMap((row) => row.coverId ? [row.coverId] : []))];
  if (ids.length === 0) return new Map();
  const media = await prisma.mediaAsset.findMany({ where: { id: { in: ids }, kind: "IMAGE" }, select: { id: true, url: true, alt: true, width: true, height: true } });
  return new Map(media.map((asset) => [asset.id, asset]));
}

function toPublicPost(row: PublicPostRecord, covers: Map<string, PublishedBlogPost["cover"]>): PublishedBlogPost {
  return { id: row.id, slug: row.slug, title: row.title, excerpt: row.excerpt, content: row.content, cover: row.coverId ? covers.get(row.coverId) ?? null : null, category: row.category, author: row.author, publishedAt: row.publishedAt?.toISOString() ?? "", readingMins: row.readingMins ?? 1, seoTitle: row.seoTitle, seoDesc: row.seoDesc };
}

async function readPublishedBlogPosts(categorySlug?: string): Promise<PublishedBlogPost[]> {
  const rows = await prisma.blogPost.findMany({ where: { ...publishedBlogWhere(new Date()), ...(categorySlug ? { category: { is: { slug: categorySlug } } } : {}) }, orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }], select: publicPostSelect });
  const covers = await coverMap(rows);
  return rows.map((row) => toPublicPost(row, covers));
}

async function readPublishedBlogPostsPage(categorySlug: string | undefined, page: number, pageSize: number): Promise<PublishedBlogPostsPage> {
  const safePageSize = Math.min(12, Math.max(1, Math.floor(pageSize)));
  const safePage = Math.max(1, Math.floor(page));
  const where = { ...publishedBlogWhere(new Date()), ...(categorySlug ? { category: { is: { slug: categorySlug } } } : {}) };
  const [total, rows] = await Promise.all([
    prisma.blogPost.count({ where }),
    prisma.blogPost.findMany({ where, orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }], skip: (safePage - 1) * safePageSize, take: safePageSize, select: publicPostSelect }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / safePageSize));
  const currentPage = Math.min(safePage, pageCount);
  const currentRows = currentPage === safePage ? rows : await prisma.blogPost.findMany({ where, orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }], skip: (currentPage - 1) * safePageSize, take: safePageSize, select: publicPostSelect });
  const covers = await coverMap(currentRows);
  return { items: currentRows.map((row) => toPublicPost(row, covers)), page: currentPage, pageSize: safePageSize, total, pageCount };
}

export function getPublishedBlogPosts(categorySlug?: string): Promise<PublishedBlogPost[]> {
  return unstable_cache(() => readPublishedBlogPosts(categorySlug), ["published-blog-posts", categorySlug ?? "all"], { tags: ["blog"], revalidate: 60 })();
}

export function getPublishedBlogPostsPage(categorySlug: string | undefined, page = 1, pageSize = 9): Promise<PublishedBlogPostsPage> {
  const key = JSON.stringify({ categorySlug, page, pageSize });
  return unstable_cache(() => readPublishedBlogPostsPage(categorySlug, page, pageSize), ["published-blog-posts-page", key], { tags: ["blog"], revalidate: 60 })();
}

async function readPublishedBlogPost(slug: string): Promise<PublishedBlogPost | null> {
  const row = await prisma.blogPost.findFirst({ where: { ...publishedBlogWhere(new Date()), slug }, select: publicPostSelect });
  if (!row) return null;
  const covers = await coverMap([row]);
  return toPublicPost(row, covers);
}

export function getPublishedBlogPost(slug: string): Promise<PublishedBlogPost | null> {
  return unstable_cache(() => readPublishedBlogPost(slug), ["published-blog-post", slug], { tags: ["blog", `post:${slug}`], revalidate: 60 })();
}

async function readPublishedBlogCategories(): Promise<PublishedBlogCategory[]> {
  return prisma.blogCategory.findMany({ where: { posts: { some: publishedBlogWhere(new Date()) } }, orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } });
}

export function getPublishedBlogCategories(): Promise<PublishedBlogCategory[]> {
  return unstable_cache(readPublishedBlogCategories, ["published-blog-categories"], { tags: ["blog"], revalidate: 60 })();
}
