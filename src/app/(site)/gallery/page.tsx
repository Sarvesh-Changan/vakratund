import type { Metadata } from "next";
import Link from "next/link";

import { GalleryLightbox } from "@/components/site/gallery-lightbox";
import { CloudImage } from "@/components/cloud-image";
import { Container, SectionHeading } from "@/components/ui";
import { getGalleryLandingData, getPublishedGallery } from "@/server/queries/gallery";
import type { GalleryDesignType } from "@/generated/prisma/client";

export const metadata: Metadata = {
  title: "Project Gallery | Vakratund Construction",
  description: "Explore interior and exterior construction, repair and rehabilitation work by Vakratund Construction.",
};

type GalleryPageProps = { searchParams: Promise<{ category?: string; design?: string }> };

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const params = await searchParams;
  const designType: GalleryDesignType | undefined = params.design === "INTERIOR" || params.design === "EXTERIOR" ? params.design : undefined;
  const landing = await getGalleryLandingData(designType);
  const selectedCategory = landing.categories.find((category) => category.slug === params.category);
  const items = await getPublishedGallery(selectedCategory?.slug, designType);

  return <Container className="py-12 sm:py-16 lg:py-20">
    <SectionHeading eyebrow="Our work" title="Construction gallery" description="Browse selected interior and exterior construction, repair and rehabilitation work." />
    {landing.categories.length > 0 ? <section className="mt-9" aria-label="Gallery categories"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{landing.categories.map((category) => <Link key={category.id} href={`/gallery?category=${encodeURIComponent(category.slug)}${designType ? `&design=${designType}` : ""}`} className="group relative overflow-hidden rounded-card border bg-surface focus-visible:outline-2 focus-visible:outline-brand-deep focus-visible:outline-offset-2"><div className="relative aspect-[16/9] bg-surface-alt"><CloudImage src={category.cover.url} alt={category.cover.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /><span className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/10 to-transparent" /><span className="absolute inset-x-4 bottom-4 font-heading text-xl font-semibold text-white">{category.name}</span></div></Link>)}</div></section> : null}
    <section className="mt-12" aria-labelledby="gallery-items-heading"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-deep">Portfolio</p><h2 id="gallery-items-heading" className="mt-2 font-heading text-2xl font-semibold">{selectedCategory?.name ?? "All published work"}</h2></div><form method="get" className="flex flex-wrap items-end gap-3"><label className="text-sm font-semibold">Category<select name="category" defaultValue={selectedCategory?.slug ?? "all"} className="mt-1 block min-h-11 rounded-control border bg-surface px-3"><option value="all">All categories</option>{landing.categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</select></label><label className="text-sm font-semibold">Design type<select name="design" defaultValue={designType ?? "all"} className="mt-1 block min-h-11 rounded-control border bg-surface px-3"><option value="all">Interior and exterior</option><option value="INTERIOR">Interior</option><option value="EXTERIOR">Exterior</option></select></label><button type="submit" className="min-h-11 rounded-control bg-brand px-4 text-sm font-semibold text-brand-ink focus-visible:outline-2 focus-visible:outline-brand-deep focus-visible:outline-offset-2">Apply filters</button></form></div>
      <div className="mt-7">{items.length > 0 ? <GalleryLightbox items={items} /> : <div className="rounded-card border border-dashed p-10 text-center"><p className="font-semibold">No published work in this selection yet</p><p className="mt-2 text-sm text-ink-muted">Choose another category or design type to explore more projects.</p></div>}</div>
    </section>
  </Container>;
}
