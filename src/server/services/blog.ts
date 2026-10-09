import "server-only";

import type { MediaKind, Prisma, PublishStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";
import { calculateReadingMinutes } from "@/lib/blog/reading-time";
import { slugify } from "@/lib/utils";
import type { CreateBlogCategoryInput, CreateBlogPostInput, UpdateBlogCategoryInput, UpdateBlogPostInput } from "@/lib/validation/blog";
import { logActivity } from "@/server/services/activity";

export type BlogCategoryView = { id: string; name: string; slug: string; createdAt: string; updatedAt: string };
export type BlogAuthorView = { id: string; name: string; email: string };
export type BlogPostView = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverId: string | null;
  cover: { id: string; kind: MediaKind; url: string; alt: string; width: number | null; height: number | null } | null;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  authorId: string | null;
  author: BlogAuthorView | null;
  status: PublishStatus;
  publishedAt: string | null;
  readingMins: number;
  seoTitle: string | null;
  seoDesc: string | null;
  createdAt: string;
  updatedAt: string;
};

type CategoryRecord = Prisma.BlogCategoryGetPayload<{ select: typeof categorySelect }>;
type PostRecord = Prisma.BlogPostGetPayload<{ select: typeof postSelect }>;

export class BlogPostNotFoundError extends Error { constructor() { super("Blog post not found."); this.name = "BlogPostNotFoundError"; } }
export class BlogCategoryNotFoundError extends Error { constructor() { super("Blog category not found."); this.name = "BlogCategoryNotFoundError"; } }
export class BlogSlugConflictError extends Error { constructor() { super("That blog slug is already in use."); this.name = "BlogSlugConflictError"; } }
export class BlogSlugInvalidError extends Error { constructor() { super("The title must produce a valid slug."); this.name = "BlogSlugInvalidError"; } }
export class BlogCategorySlugConflictError extends Error { constructor() { super("That category slug is already in use."); this.name = "BlogCategorySlugConflictError"; } }
export class BlogRelationNotFoundError extends Error { readonly field: "coverId" | "categoryId" | "authorId"; constructor(field: "coverId" | "categoryId" | "authorId", message: string) { super(message); this.name = "BlogRelationNotFoundError"; this.field = field; } }
export class BlogCoverMustBeImageError extends Error { constructor() { super("The blog cover must be an image."); this.name = "BlogCoverMustBeImageError"; } }

const categorySelect = { id: true, name: true, slug: true, createdAt: true, updatedAt: true } satisfies Prisma.BlogCategorySelect;
const postSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  content: true,
  coverId: true,
  categoryId: true,
  category: { select: { id: true, name: true, slug: true } },
  authorId: true,
  author: { select: { id: true, name: true, email: true } },
  status: true,
  publishedAt: true,
  readingMins: true,
  seoTitle: true,
  seoDesc: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BlogPostSelect;

function toCategoryView(record: CategoryRecord): BlogCategoryView { return { ...record, createdAt: record.createdAt.toISOString(), updatedAt: record.updatedAt.toISOString() }; }
type Cover = BlogPostView["cover"];
function toPostView(record: PostRecord, cover: Cover): BlogPostView { return { ...record, cover, readingMins: record.readingMins ?? 1, publishedAt: record.publishedAt?.toISOString() ?? null, createdAt: record.createdAt.toISOString(), updatedAt: record.updatedAt.toISOString() }; }
function nullableString(value: string | undefined): string | null { return value?.trim() ? value.trim() : null; }

async function coversFor(ids: readonly (string | null)[]): Promise<Map<string, Cover>> {
  const coverIds = [...new Set(ids.flatMap((id) => id ? [id] : []))];
  if (coverIds.length === 0) return new Map();
  const rows = await prisma.mediaAsset.findMany({ where: { id: { in: coverIds } }, select: { id: true, kind: true, url: true, alt: true, width: true, height: true } });
  return new Map(rows.map((row) => [row.id, row.kind === "IMAGE" ? row : null]));
}

async function validateRelations(input: CreateBlogPostInput | UpdateBlogPostInput): Promise<void> {
  if (input.coverId) {
    const cover = await prisma.mediaAsset.findUnique({ where: { id: input.coverId }, select: { id: true, kind: true } });
    if (!cover) throw new BlogRelationNotFoundError("coverId", "The selected cover image no longer exists.");
    if (cover.kind !== "IMAGE") throw new BlogCoverMustBeImageError();
  }
  if (input.categoryId) {
    const category = await prisma.blogCategory.findUnique({ where: { id: input.categoryId }, select: { id: true } });
    if (!category) throw new BlogRelationNotFoundError("categoryId", "The selected category no longer exists.");
  }
  if (input.authorId) {
    const author = await prisma.user.findUnique({ where: { id: input.authorId }, select: { id: true, isActive: true } });
    if (!author || !author.isActive) throw new BlogRelationNotFoundError("authorId", "The selected author is unavailable.");
  }
}

async function uniquePostSlug(input: CreateBlogPostInput | UpdateBlogPostInput, excludeId?: string): Promise<string> {
  const candidate = slugify(input.slug || input.title);
  if (!candidate) throw new BlogSlugInvalidError();
  const existing = await prisma.blogPost.findFirst({ where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } });
  if (existing) throw new BlogSlugConflictError();
  return candidate;
}

async function uniqueCategorySlug(input: CreateBlogCategoryInput | UpdateBlogCategoryInput, excludeId?: string): Promise<string> {
  const candidate = slugify(input.slug || input.name);
  if (!candidate) throw new BlogSlugInvalidError();
  const existing = await prisma.blogCategory.findFirst({ where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } });
  if (existing) throw new BlogCategorySlugConflictError();
  return candidate;
}

function postData(input: CreateBlogPostInput | UpdateBlogPostInput, slug: string): Prisma.BlogPostUncheckedCreateInput {
  return { title: input.title, slug, excerpt: input.excerpt, content: input.content, coverId: input.coverId, categoryId: input.categoryId, authorId: input.authorId, status: input.status, publishedAt: input.status === "PUBLISHED" ? input.publishedAt ?? new Date() : input.publishedAt, readingMins: calculateReadingMinutes(input.content), seoTitle: nullableString(input.seoTitle), seoDesc: nullableString(input.seoDesc) };
}

async function views(rows: readonly PostRecord[]): Promise<BlogPostView[]> {
  const covers = await coversFor(rows.map((row) => row.coverId));
  return rows.map((row) => toPostView(row, row.coverId ? covers.get(row.coverId) ?? null : null));
}

export async function listBlogCategories(): Promise<BlogCategoryView[]> {
  const rows = await prisma.blogCategory.findMany({ orderBy: [{ name: "asc" }], select: categorySelect });
  return rows.map(toCategoryView);
}

export async function createBlogCategory(input: CreateBlogCategoryInput, userId: string): Promise<BlogCategoryView> {
  const categorySlug = await uniqueCategorySlug(input);
  const row = await prisma.blogCategory.create({ data: { name: input.name, slug: categorySlug }, select: categorySelect });
  await logActivity({ userId, action: "blogCategory.create", entityType: "BlogCategory", entityId: row.id, summary: `Created blog category ${row.name}`, diff: { slug: row.slug } });
  return toCategoryView(row);
}

export async function updateBlogCategory(input: UpdateBlogCategoryInput, userId: string): Promise<BlogCategoryView> {
  const current = await prisma.blogCategory.findUnique({ where: { id: input.id }, select: { id: true } });
  if (!current) throw new BlogCategoryNotFoundError();
  const categorySlug = await uniqueCategorySlug(input, input.id);
  const row = await prisma.blogCategory.update({ where: { id: input.id }, data: { name: input.name, slug: categorySlug }, select: categorySelect });
  await logActivity({ userId, action: "blogCategory.update", entityType: "BlogCategory", entityId: row.id, summary: `Updated blog category ${row.name}`, diff: { slug: row.slug } });
  return toCategoryView(row);
}

export async function deleteBlogCategory(id: string, userId: string): Promise<{ deleted: true; id: string }> {
  const row = await prisma.blogCategory.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!row) throw new BlogCategoryNotFoundError();
  await prisma.blogCategory.delete({ where: { id } });
  await logActivity({ userId, action: "blogCategory.delete", entityType: "BlogCategory", entityId: id, summary: `Deleted blog category ${row.name}` });
  return { deleted: true, id };
}

export async function listBlogAuthors(): Promise<BlogAuthorView[]> {
  return prisma.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true } });
}

export async function listBlogPosts(filters: { q?: string; status?: PublishStatus; categoryId?: string } = {}): Promise<BlogPostView[]> {
  const q = filters.q?.trim();
  const rows = await prisma.blogPost.findMany({ where: { ...(filters.status ? { status: filters.status } : {}), ...(filters.categoryId ? { categoryId: filters.categoryId } : {}), ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }, { excerpt: { contains: q, mode: "insensitive" } }] } : {}) }, orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }], select: postSelect });
  return views(rows);
}

export async function getBlogPost(id: string): Promise<BlogPostView | null> {
  const row = await prisma.blogPost.findUnique({ where: { id }, select: postSelect });
  if (!row) return null;
  return (await views([row]))[0] ?? null;
}

export async function createBlogPost(input: CreateBlogPostInput, userId: string): Promise<BlogPostView> {
  const postSlug = await uniquePostSlug(input); await validateRelations(input);
  const row = await prisma.blogPost.create({ data: postData(input, postSlug), select: postSelect });
  await logActivity({ userId, action: "blogPost.create", entityType: "BlogPost", entityId: row.id, summary: `Created blog post ${row.title}`, diff: { slug: row.slug, status: row.status, publishedAt: row.publishedAt?.toISOString() ?? null, readingMins: row.readingMins } });
  return (await views([row]))[0] as BlogPostView;
}

export async function updateBlogPost(input: UpdateBlogPostInput, userId: string): Promise<BlogPostView> {
  const current = await prisma.blogPost.findUnique({ where: { id: input.id }, select: { id: true } });
  if (!current) throw new BlogPostNotFoundError();
  const postSlug = await uniquePostSlug(input, input.id); await validateRelations(input);
  const row = await prisma.blogPost.update({ where: { id: input.id }, data: postData(input, postSlug), select: postSelect });
  await logActivity({ userId, action: "blogPost.update", entityType: "BlogPost", entityId: row.id, summary: `Updated blog post ${row.title}`, diff: { slug: row.slug, status: row.status, publishedAt: row.publishedAt?.toISOString() ?? null, readingMins: row.readingMins } });
  return (await views([row]))[0] as BlogPostView;
}

export async function deleteBlogPost(id: string, userId: string): Promise<{ deleted: true; id: string }> {
  const row = await prisma.blogPost.findUnique({ where: { id }, select: { id: true, title: true, slug: true } });
  if (!row) throw new BlogPostNotFoundError();
  await prisma.blogPost.delete({ where: { id } });
  await logActivity({ userId, action: "blogPost.delete", entityType: "BlogPost", entityId: id, summary: `Deleted blog post ${row.title}`, diff: { slug: row.slug } });
  return { deleted: true, id };
}

export async function togglePublishBlogPost(input: { id: string; published: boolean }, userId: string): Promise<BlogPostView> {
  const row = await prisma.blogPost.findUnique({ where: { id: input.id }, select: { id: true, title: true, publishedAt: true } });
  if (!row) throw new BlogPostNotFoundError();
  const nextStatus = input.published ? "PUBLISHED" : "DRAFT";
  const updated = await prisma.blogPost.update({ where: { id: input.id }, data: { status: nextStatus, publishedAt: input.published ? row.publishedAt ?? new Date() : row.publishedAt }, select: postSelect });
  await logActivity({ userId, action: "blogPost.togglePublish", entityType: "BlogPost", entityId: updated.id, summary: `${input.published ? "Published" : "Unpublished"} blog post ${updated.title}`, diff: { status: updated.status, publishedAt: updated.publishedAt?.toISOString() ?? null } });
  return (await views([updated]))[0] as BlogPostView;
}
