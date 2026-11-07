import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { TestimonialsGrid } from "@/components/site/testimonials-grid";
import { Breadcrumbs, Container, EmptyState, SectionHeading } from "@/components/ui";
import type { PublishedTestimonial } from "@/server/queries/testimonials";

const breadcrumbs = [{ name: "Home", item: "/" }, { name: "Testimonials", item: "/testimonials" }] as const;

export function TestimonialsPage({ testimonials }: { testimonials: PublishedTestimonial[] }) {
  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <section className="bg-charcoal pt-32 text-white sm:pt-36">
        <Container className="pb-16 lg:pb-20">
          <Breadcrumbs items={breadcrumbs.map((item) => ({ label: item.name, href: item.item }))} className="text-white/65" />
          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.14em] text-brand">Testimonials</p>
          <h1 className="mt-3 max-w-3xl font-heading text-4xl font-bold tracking-tight sm:text-5xl">Experiences shared by clients</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">Published feedback from clients and project partners.</p>
        </Container>
      </section>
      <Container className="py-16 lg:py-24">
        <SectionHeading eyebrow="Client perspective" title="What clients say" />
        {testimonials.length === 0 ? (
          <div className="mt-10">
            <EmptyState title="Testimonials are on their way" description="We are preparing approved client feedback for this page. In the meantime, explore our services and project work." />
          </div>
        ) : (
          <TestimonialsGrid testimonials={testimonials} />
        )}
      </Container>
    </>
  );
}
