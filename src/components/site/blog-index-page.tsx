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
      <section className="bg-surface-alt">
        <Container className="section-space-generous">
          <form
            method="get"
            action="/blog"
            className="mb-12 flex flex-col gap-3 rounded-card border bg-surface p-4 sm:flex-row sm:items-end"
          >
            <label className="text-sm font-semibold text-ink">
              Category
              <select
                name="category"
                defaultValue={categorySlug ?? ""}
                className="mt-1 min-h-11 w-full rounded-control border bg-surface px-3 text-base font-normal text-ink sm:min-w-64"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" variant="secondary">
              Filter
            </Button>
            {categorySlug ? (
              <Link
                href="/blog"
                className="inline-flex min-h-11 items-center justify-center rounded-control px-4 text-sm font-semibold text-brand-deep hover:underline"
              >
                Clear
              </Link>
            ) : null}
          </form>
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
              <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {result.items.map((post) => (
                  <Reveal key={post.id}>
                    <BlogCard post={post} />
                  </Reveal>
                ))}
              </RevealGroup>
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
