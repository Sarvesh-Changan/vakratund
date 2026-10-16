import type { Metadata } from "next";
import Link from "next/link";

import { GalleryLightbox } from "@/components/site/gallery-lightbox";
import { CloudImage } from "@/components/cloud-image";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { HoverCard, MaskImage, Reveal, RevealGroup } from "@/components/motion";
import { Container } from "@/components/ui";
import {
  getGalleryLandingData,
  getPublishedGallery,
} from "@/server/queries/gallery";
import type { GalleryDesignType } from "@/generated/prisma/client";
import { PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = {
  title: "Project Gallery | Vakratund Construction",
  description:
    "Explore interior and exterior construction, repair and rehabilitation work by Vakratund Construction.",
};

type GalleryPageProps = {
  searchParams: Promise<{ category?: string; design?: string }>;
};

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const params = await searchParams;
  const designType: GalleryDesignType | undefined =
    params.design === "INTERIOR" || params.design === "EXTERIOR"
      ? params.design
      : undefined;
  const landing = await getGalleryLandingData(designType);
  const selectedCategory = landing.categories.find(
    (category) => category.slug === params.category,
  );
  const items = await getPublishedGallery(selectedCategory?.slug, designType);
  const breadcrumbs = [
    { name: "Home", item: "/" },
    { name: "Gallery", item: "/gallery" },
  ] as const;

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <PageHero
        breadcrumbs={breadcrumbs.map((item) => ({
          label: item.name,
          href: item.item,
        }))}
        eyebrow="Our work"
        title="Construction gallery"
        description="Browse selected interior and exterior construction, repair and rehabilitation work."
      />
      <section className="bg-surface-alt">
        <Container className="section-space-generous">
          {landing.categories.length > 0 ? (
            <section className="mb-16" aria-label="Gallery categories">
              <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {landing.categories.map((category) => (
                  <Reveal key={category.id}>
                    <HoverCard className="rounded-card">
                      <Link
                        href={`/gallery?category=${encodeURIComponent(category.slug)}${designType ? `&design=${designType}` : ""}`}
                        className="group relative block overflow-hidden rounded-card bg-surface focus-visible:outline-2 focus-visible:outline-brand-deep focus-visible:outline-offset-2"
                      >
                        <MaskImage>
                          <div className="relative aspect-[16/9] bg-surface-alt">
                            <CloudImage
                              src={category.cover.url}
                              alt={category.cover.title}
                              fill
                              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                              data-hover-image
                              className="object-cover"
                            />
                            <span className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/10 to-transparent" />
                            <span className="absolute inset-x-4 bottom-4 font-heading text-xl font-semibold text-white">
                              {category.name}
                            </span>
                          </div>
                        </MaskImage>
                      </Link>
                    </HoverCard>
                  </Reveal>
                ))}
              </RevealGroup>
            </section>
          ) : null}
          <section aria-labelledby="gallery-items-heading">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Portfolio</p>
                <h2
                  id="gallery-items-heading"
                  className="mt-2 font-heading text-h2 font-semibold"
                >
                  {selectedCategory?.name ?? "All published work"}
                </h2>
              </div>
              <form method="get" className="flex flex-wrap items-end gap-3">
                <label className="text-sm font-semibold">
                  Category
                  <select
                    name="category"
                    defaultValue={selectedCategory?.slug ?? "all"}
                    className="mt-1 block min-h-11 rounded-control border bg-surface px-3"
                  >
                    <option value="all">All categories</option>
                    {landing.categories.map((category) => (
                      <option key={category.id} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  Design type
                  <select
                    name="design"
                    defaultValue={designType ?? "all"}
                    className="mt-1 block min-h-11 rounded-control border bg-surface px-3"
                  >
                    <option value="all">Interior and exterior</option>
                    <option value="INTERIOR">Interior</option>
                    <option value="EXTERIOR">Exterior</option>
                  </select>
                </label>
                <button
                  type="submit"
                  className="min-h-11 rounded-control bg-brand px-4 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-brand-deep focus-visible:outline-offset-2 active:scale-[0.98]"
                >
                  Apply filters
                </button>
              </form>
            </div>
            <div className="mt-7">
              {items.length > 0 ? (
                <GalleryLightbox items={items} />
              ) : (
                <div className="rounded-card border border-dashed p-10 text-center">
                  <p className="font-semibold">
                    No published work in this selection yet
                  </p>
                  <p className="mt-2 text-sm text-ink-muted">
                    Choose another category or design type to explore more
                    projects.
                  </p>
                </div>
              )}
            </div>
          </section>
        </Container>
      </section>
    </>
  );
}
