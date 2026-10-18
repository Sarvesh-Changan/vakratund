import Link from "next/link";

import { Reveal, RevealGroup } from "@/components/motion";
import { BlogCard } from "@/components/site/blog-card";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Button, Container, EmptyState, SectionHeading } from "@/components/ui";
import type {
  PublishedBlogCategory,
  PublishedBlogPostsPage,
} from "@/server/queries/blog";
import { PageHero } from "./page-hero";

const breadcrumbs = [
  { name: "Home", item: "/" },
  { name: "Blog", item: "/blog" },
] as const;

function pageHref(page: number, categorySlug?: string): string {
  const params = new URLSearchParams();
  if (categorySlug) params.set("category", categorySlug);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/blog?${query}` : "/blog";
}

function BlogPagination({
  page,
  pageCount,
  categorySlug,
}: {
  page: number;
  pageCount: number;
  categorySlug?: string;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav
      aria-label="Blog pagination"
      className="mt-12 flex items-center justify-center gap-3"
    >
      <Link
        href={pageHref(page - 1, categorySlug)}
        aria-disabled={page <= 1}
        className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
      >
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page <= 1}
        >
          Previous
        </Button>
      </Link>
      <span aria-live="polite" className="px-2 text-sm text-ink-muted">
        Page {page} of {pageCount}
      </span>
      <Link
        href={pageHref(page + 1, categorySlug)}
        aria-disabled={page >= pageCount}
        className={
          page >= pageCount ? "pointer-events-none opacity-50" : undefined
        }
      >
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page >= pageCount}
        >
          Next
        </Button>
      </Link>
    </nav>
  );
}

export function BlogIndexPage({
  result,
  categories,
  categorySlug,
}: {
  result: PublishedBlogPostsPage;
  categories: PublishedBlogCategory[];
  categorySlug?: string;
}) {
  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <PageHero
        breadcrumbs={breadcrumbs.map((item) => ({
          label: item.name,
          href: item.item,
        }))}
        eyebrow="Insights"
        title="Construction and project insights"
        description="Practical articles on construction, structural repair, project management and related work."
      />
      <section className="section-tint">
        <Container className="section-space-generous">
          <div className="mb-12 flex flex-wrap items-center gap-2" aria-label="Blog categories"><span className="mr-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">Explore</span><Link href="/blog" aria-current={!categorySlug ? "page" : undefined} className={`inline-flex min-h-10 items-center rounded-pill border px-4 text-sm font-semibold ${!categorySlug ? "border-dark bg-dark text-white" : "border-line bg-bg text-ink hover:bg-tint"}`}>All insights</Link>{categories.map((category) => <Link key={category.id} href={`/blog?category=${encodeURIComponent(category.slug)}`} aria-current={category.slug === categorySlug ? "page" : undefined} className={`inline-flex min-h-10 items-center rounded-pill border px-4 text-sm font-semibold ${category.slug === categorySlug ? "border-accent bg-accent/15 text-accent-ink" : "border-line bg-bg text-ink hover:bg-tint"}`}>{category.name}</Link>)}</div>
          <SectionHeading
            eyebrow="Published articles"
            title={
              categorySlug
                ? (categories.find((category) => category.slug === categorySlug)
                    ?.name ?? "Filtered articles")
                : "Latest from the team"
            }
            description={
              result.total > 0
                ? `${result.total} published ${result.total === 1 ? "article" : "articles"}.`
                : undefined
            }
          />
          <div className="mt-10">
            {result.items.length === 0 ? (
              <EmptyState
                title="No published articles found"
                description={
                  categorySlug
                    ? "Try another category or return to all articles."
                    : "Published articles will appear here once they are available."
                }
                action={
                  categorySlug ? (
                    <Link
                      href="/blog"
                      className="font-semibold text-brand-deep hover:underline"
                    >
                      View all articles
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              <>
              {result.page === 1 && !categorySlug && result.items[0] ? <Reveal><div className="mb-8"><BlogCard post={result.items[0]} featured /></div></Reveal> : null}
              <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {result.items.slice(result.page === 1 && !categorySlug ? 1 : 0).map((post) => (
                  <Reveal key={post.id}>
                    <BlogCard post={post} />
                  </Reveal>
                ))}
              </RevealGroup>
              </>
            )}
          </div>
          <BlogPagination
            page={result.page}
            pageCount={result.pageCount}
            categorySlug={categorySlug}
          />
        </Container>
      </section>
    </>
  );
}
