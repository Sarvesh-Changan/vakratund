import Link from "next/link";

import { GalleryLightbox } from "@/components/site/gallery-lightbox";
import { Container, SectionHeading } from "@/components/ui";
import type { PublishedGalleryItem } from "@/server/queries/gallery";

export function HomeGallery({ items }: { items: PublishedGalleryItem[] }) {
  if (items.length === 0) return null;
  return <section className="bg-surface-alt"><Container className="py-16 lg:py-20"><SectionHeading eyebrow="Featured gallery" title="A closer look at our work" description="A selection of construction, interiors and rehabilitation work delivered by our team." action={<Link href="/gallery" className="inline-flex min-h-11 items-center font-semibold text-brand-deep hover:underline">Explore gallery</Link>} /><div className="mt-8"><GalleryLightbox items={items} /></div></Container></section>;
}
