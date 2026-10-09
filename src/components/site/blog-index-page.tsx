import Link from "next/link";

import { BlogCard } from "@/components/site/blog-card";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs, Button, Container, EmptyState, SectionHeading } from "@/components/ui";
import type { PublishedBlogCategory, PublishedBlogPostsPage } from "@/server/queries/blog";

const breadcrumbs = [{ name: "Home", item: "/" }, { name: "Blog", item: "/blog" }] as const;

function pageHref(page: number, categorySlug?: string): string {
  const params = new URLSearchParams();
  if (categorySlug) params.set("category", categorySlug);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/blog?${query}` : "/blog";
}

function BlogPagination({ page, pageCount, categorySlug }: { page: number; pageCount: number; categorySlug?: string }) {
  if (pageCount <= 1) return null;
  return <nav aria-label="Blog pagination" className="mt-12 flex items-center justify-center gap-3"><Link href={pageHref(page - 1, categorySlug)} aria-disabled={page <= 1} className={page <= 1 ? "pointer-events-none opacity-50" : undefined}><Button type="button" variant="secondary" size="sm" disabled={page <= 1}>Previous</Button></Link><span aria-live="polite" className="px-2 text-sm text-ink-muted">Page {page} of {pageCount}</span><Link href={pageHref(page + 1, categorySlug)} aria-disabled={page >= pageCount} className={page >= pageCount ? "pointer-events-none opacity-50" : undefined}><Button type="button" variant="secondary" size="sm" disabled={page >= pageCount}>Next</Button></Link></nav>;
}

export function BlogIndexPage({ result, categories, categorySlug }: { result: PublishedBlogPostsPage; categories: PublishedBlogCategory[]; categorySlug?: string }) {
  return <><BreadcrumbJsonLd items={breadcrumbs} /><section className="bg-charcoal pt-32 text-white sm:pt-36"><Container className="pb-16 lg:pb-20"><Breadcrumbs items={breadcrumbs.map((item) => ({ label: item.name, href: item.item }))} className="text-white/65" /><p className="mt-10 text-sm font-semibold uppercase tracking-[0.14em] text-brand">Insights</p><h1 className="mt-3 max-w-3xl font-heading text-4xl font-bold tracking-tight sm:text-5xl">Construction and project insights</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">Practical articles on construction, structural repair, project management and related work.</p></Container></section><Container className="py-16 lg:py-24"><form method="get" action="/blog" className="flex flex-col gap-3 rounded-card border bg-surface p-4 sm:flex-row sm:items-end"><label className="text-sm font-semibold text-ink">Category<select name="category" defaultValue={categorySlug ?? ""} className="mt-1 min-h-11 w-full rounded-control border bg-surface px-3 text-base font-normal text-ink sm:min-w-64"><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</select></label><Button type="submit" variant="secondary">Filter</Button>{categorySlug ? <Link href="/blog" className="inline-flex min-h-11 items-center justify-center rounded-control px-4 text-sm font-semibold text-brand-deep hover:underline">Clear</Link> : null}</form><SectionHeading eyebrow="Published articles" title={categorySlug ? categories.find((category) => category.slug === categorySlug)?.name ?? "Filtered articles" : "Latest from the team"} description={result.total > 0 ? `${result.total} published ${result.total === 1 ? "article" : "articles"}.` : undefined} /><div className="mt-10">{result.items.length === 0 ? <EmptyState title="No published articles found" description={categorySlug ? "Try another category or return to all articles." : "Published articles will appear here once they are available."} action={categorySlug ? <Link href="/blog" className="font-semibold text-brand-deep hover:underline">View all articles</Link> : undefined} /> : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{result.items.map((post) => <BlogCard key={post.id} post={post} />)}</div>}</div><BlogPagination page={result.page} pageCount={result.pageCount} categorySlug={categorySlug} /></Container></>;
}
