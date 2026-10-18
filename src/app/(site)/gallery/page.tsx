import type { Metadata } from "next";
import Link from "next/link";

import { BreadcrumbJsonLd, ImageGalleryJsonLd } from "@/components/seo/json-ld";
import { GalleryLightbox } from "@/components/site/gallery-lightbox";
import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/ui";
import { buildMetadata } from "@/lib/seo/metadata";
import { getGalleryLandingData } from "@/server/queries/gallery";
import { getPublicSeo } from "@/server/queries/seo";

export const revalidate = 3600;

type GalleryParams = { category?: string; year?: string };
type GalleryPageProps = { searchParams: Promise<GalleryParams> };

async function readParams(searchParams: Promise<GalleryParams>): Promise<{ categorySlug?: string; year?: number }> {
  const params = await searchParams;
  const numericYear = params.year ? Number(params.year) : undefined;
  return {
    ...(params.category?.trim() ? { categorySlug: params.category.trim() } : {}),
    ...(numericYear && Number.isInteger(numericYear) ? { year: numericYear } : {}),
  };
}

export async function generateMetadata({ searchParams }: GalleryPageProps): Promise<Metadata> {
  const filter = await readParams(searchParams);
  const pageSeo = await getPublicSeo("/gallery").catch(() => null);
  const filtered = Boolean(filter.categorySlug || filter.year);
  return buildMetadata({ path: "/gallery", fallbackTitle: filtered ? "Filtered project gallery" : "Project gallery", fallbackDescription: "Explore selected construction, repair, rehabilitation and turnkey project work by Vakratund Construction.", pageSeo, noIndex: filtered, noIndexFollow: filtered });
}

export default async function GalleryRoute({ searchParams }: GalleryPageProps) {
  const filter = await readParams(searchParams);
  const landing = await getGalleryLandingData(filter).catch(() => ({ categories: [], years: [], items: [], counts: { categories: {}, years: {} } }));
  const selectedCategory = landing.categories.find((category) => category.slug === filter.categorySlug);
  const breadcrumbs = [{ name: "Home", item: "/" }, { name: "Gallery", item: "/gallery" }] as const;
  const query = (category?: string, year?: number) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (year) params.set("year", String(year));
    const value = params.toString();
    return value ? `/gallery?${value}` : "/gallery";
  };
  const hasFilter = Boolean(filter.categorySlug || filter.year);
  const years = Array.from(new Set(landing.items.map((item) => item.year))).sort((a, b) => b - a);

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      {!hasFilter ? <ImageGalleryJsonLd gallery={{ name: "Vakratund Construction project gallery", description: "Selected construction, repair and rehabilitation work by Vakratund Construction.", url: "/gallery", images: landing.items.slice(0, 20).map((item) => item.url) }} /> : null}
      <PageHero breadcrumbs={breadcrumbs.map((item) => ({ label: item.name, href: item.item }))} eyebrow="Our work" title="Construction gallery" description="Browse selected construction, repair, rehabilitation and turnkey work, organized by category and year." />
      <section className="section-tint">
        <Container className="section-space-generous">
          <div className="sticky top-20 z-10 rounded-card border bg-surface/95 p-4 shadow-soft backdrop-blur">
            <div className="grid gap-3 lg:grid-cols-[5rem_1fr]">
              <p className="text-sm font-semibold">Categories</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <Link href={query(undefined, filter.year)} aria-current={!filter.categorySlug ? "page" : undefined} className={`inline-flex min-h-10 shrink-0 items-center rounded-pill border px-4 text-sm font-semibold ${!filter.categorySlug ? "border-dark bg-dark text-white" : "border-line hover:bg-tint"}`}>All</Link>
                {landing.categories.map((category) => <Link key={category.id} href={query(category.slug, filter.year)} aria-current={filter.categorySlug === category.slug ? "page" : undefined} className={`inline-flex min-h-10 shrink-0 items-center rounded-pill border px-4 text-sm font-semibold ${filter.categorySlug === category.slug ? "border-dark bg-dark text-white" : "border-line hover:bg-tint"}`}>{category.name}<span className="ml-2 text-xs opacity-70">{category.count}</span></Link>)}
              </div>
              <p className="text-sm font-semibold">Years</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <Link href={query(filter.categorySlug)} aria-current={!filter.year ? "page" : undefined} className={`inline-flex min-h-10 shrink-0 items-center rounded-pill border px-4 text-sm font-semibold ${!filter.year ? "border-dark bg-dark text-white" : "border-line hover:bg-tint"}`}>All</Link>
                {landing.years.map((entry) => <Link key={entry.id} href={query(filter.categorySlug, entry.year)} aria-current={filter.year === entry.year ? "page" : undefined} className={`inline-flex min-h-10 shrink-0 items-center rounded-pill border px-4 text-sm font-semibold ${filter.year === entry.year ? "border-dark bg-dark text-white" : "border-line hover:bg-tint"}`}>{entry.year}<span className="ml-2 text-xs opacity-70">{entry.count}</span></Link>)}
              </div>
            </div>
          </div>
          {landing.items.length > 0 ? (
            <section className="mt-8" aria-labelledby="gallery-items-heading">
              <div className="mb-5 flex items-end justify-between gap-4"><div><p className="eyebrow">Portfolio</p><h2 id="gallery-items-heading" className="mt-2 font-heading text-h2 font-semibold">{selectedCategory?.name ?? (filter.year ? `Work from ${filter.year}` : "All published work")}</h2></div>{hasFilter ? <Link href="/gallery" className="text-sm font-semibold text-accent-ink hover:underline">Clear filters</Link> : null}</div>
              {!filter.year ? <div className="space-y-10">{years.map((year) => <section key={year} aria-labelledby={`gallery-year-${year}`}><h3 id={`gallery-year-${year}`} className="mb-4 font-heading text-xl font-semibold">{year}</h3><GalleryLightbox items={landing.items.filter((item) => item.year === year)} /></section>)}</div> : <GalleryLightbox items={landing.items} />}
            </section>
          ) : (
            <div className="mt-8 rounded-card border border-dashed p-10 text-center"><p className="font-semibold">{hasFilter ? "No results for these filters" : "No gallery images yet"}</p><p className="mt-2 text-sm text-ink-muted">{hasFilter ? "Try another category or year." : "We are preparing selected project work. Contact us to discuss your requirement."}</p><div className="mt-5 flex justify-center gap-3"><Link href="/contact" className="inline-flex min-h-11 items-center rounded-control bg-brand px-4 font-semibold text-brand-ink">Contact us</Link>{hasFilter ? <Link href="/gallery" className="inline-flex min-h-11 items-center rounded-control border px-4 font-semibold">Clear filters</Link> : null}</div></div>
          )}
        </Container>
      </section>
    </>
  );
}
