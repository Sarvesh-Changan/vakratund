import type { Metadata } from "next";

import { TestimonialsPage } from "@/components/site/testimonials-page";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPublishedTestimonials } from "@/server/queries/testimonials";
import { getPublicSeo } from "@/server/queries/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const pageSeo = await getPublicSeo("/testimonials").catch(() => null);
  return buildMetadata({ path: "/testimonials", fallbackTitle: "Testimonials", fallbackDescription: "Read published client feedback about Vakratund Construction.", pageSeo });
}

export default async function TestimonialsRoute() {
  const testimonials = await getPublishedTestimonials().catch(() => []);
  return <TestimonialsPage testimonials={testimonials} />;
}
