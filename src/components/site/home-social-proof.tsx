import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PublishedTestimonial } from "@/server/queries/testimonials";
import { Button, Container, Reveal, SectionHeading } from "@/components/ui";
import { TestimonialsGrid } from "./testimonials-grid";

export function HomeSocialProof({ testimonials }: { testimonials: PublishedTestimonial[] }) {
  if (testimonials.length === 0) return null;
  const topTestimonials = testimonials.slice(0, 3);

  return (
    <section className="section-light">
      <Container className="py-20 lg:py-28">
        <SectionHeading
          eyebrow="Client perspective"
          title="Work that earns trust"
          action={
            <Link
              href="/testimonials"
              className="inline-flex min-h-11 items-center gap-2 self-start rounded-control font-semibold text-accent-ink hover:underline"
            >
              Read testimonials <ArrowRight size={17} aria-hidden="true" />
            </Link>
          }
        />
        <Reveal>
          {/* Top 3 testimonials in a single horizontal row on tablets and desktop */}
          <TestimonialsGrid
            testimonials={topTestimonials}
            className="mt-10 grid gap-6 grid-cols-1 md:grid-cols-3"
          />

          {/* View all testimonials button */}
          <div className="mt-12 flex justify-center">
            <Link href="/testimonials">
              <Button size="lg" variant="secondary" className="gap-2 shadow-soft hover:shadow-md">
                View all testimonials
                <ArrowRight size={18} aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
