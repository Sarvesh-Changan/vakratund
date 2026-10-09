import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PublishedTestimonial } from "@/server/queries/testimonials";
import { Container, Reveal, SectionHeading } from "@/components/ui";
import { TestimonialsCarousel } from "./testimonials-carousel";

export function HomeSocialProof({ testimonials }: { testimonials: PublishedTestimonial[] }) {
  if (testimonials.length === 0) return null;
  return <section className="bg-surface-alt"><Container className="py-20 lg:py-28"><SectionHeading eyebrow="Client perspective" title="Work that earns trust" action={<Link href="/testimonials" className="inline-flex min-h-11 items-center gap-2 self-start rounded-control font-semibold text-brand-deep hover:underline">Read testimonials <ArrowRight size={17} aria-hidden="true" /></Link>} /><Reveal><TestimonialsCarousel testimonials={testimonials} /></Reveal></Container></section>;
}
