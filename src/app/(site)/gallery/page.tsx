import type { Metadata } from "next";
import Link from "next/link";

import { BreadcrumbJsonLd, ImageGalleryJsonLd } from "@/components/seo/json-ld";
import { GalleryLightbox, type GalleryCategoryCollection } from "@/components/site/gallery-lightbox";
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
  const categoryCollections: GalleryCategoryCollection[] = landing.categories.flatMap((category) => {
    const items = landing.items.filter((item) => item.categoryId === category.id);
    const cover = items.some((item) => item.id === category.cover.id) ? category.cover : items[0];
    return cover ? [{ category, items, cover }] : [];
  });

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      {!hasFilter ? <ImageGalleryJsonLd gallery={{ name: "Vakratund Construction project gallery", description: "Selected construction, repair and rehabilitation work by Vakratund Construction.", url: "/gallery", images: landing.items.slice(0, 20).map((item) => item.url) }} /> : null}
      <section className="section-tint">
        <Container className="section-space-generous">
          <div className="rounded-card border bg-surface/95 p-4 shadow-soft backdrop-blur">
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
          {categoryCollections.length > 0 ? (
            <section className="mt-8" aria-labelledby="gallery-items-heading">
              {filter.categorySlug ? <>
                <Link href={query(undefined, filter.year)} className="inline-flex min-h-10 items-center rounded-pill border border-line bg-surface px-4 text-sm font-semibold text-ink-muted hover:bg-tint">← Back to all categories</Link>
                <div className="mt-7 border-b border-line pb-6"><p className="eyebrow">Gallery collection</p><h2 id="gallery-items-heading" className="mt-2 font-heading text-h2 font-semibold">{selectedCategory?.name ?? "Gallery collection"}</h2><p className="mt-3 text-sm leading-6 text-ink-muted">Displaying {landing.items.length} published {landing.items.length === 1 ? "design" : "designs"} in this category.</p></div>
                <div className="mt-8"><GalleryLightbox items={landing.items} /></div>
              </> : <>
                <div className="mb-7"><p className="eyebrow">Portfolio</p><h2 id="gallery-items-heading" className="mt-2 font-heading text-h2 font-semibold">Gallery collections</h2></div>
                <GalleryLightbox items={landing.items} categories={categoryCollections} categoryBaseHref={filter.year ? `/gallery?year=${filter.year}&category=` : "/gallery?category="} />
              </>}
            </section>
          ) : (
            <div className="mt-8 rounded-card border border-dashed p-10 text-center"><p className="font-semibold">{hasFilter ? "No results for these filters" : "No gallery images yet"}</p><p className="mt-2 text-sm text-ink-muted">{hasFilter ? "Try another category or year." : "We are preparing selected project work. Contact us to discuss your requirement."}</p><div className="mt-5 flex justify-center gap-3"><Link href="/contact" className="inline-flex min-h-11 items-center rounded-control bg-brand px-4 font-semibold text-brand-ink">Contact us</Link>{hasFilter ? <Link href="/gallery" className="inline-flex min-h-11 items-center rounded-control border px-4 font-semibold">Clear filters</Link> : null}</div></div>
          )}
        </Container>
      </section>
    </>
  );
}
