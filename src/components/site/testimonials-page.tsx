import { Quote, Star } from "lucide-react";

import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Badge, Breadcrumbs, Card, Container, EmptyState, SectionHeading } from "@/components/ui";
import type { PublishedTestimonial } from "@/server/queries/testimonials";

const breadcrumbs = [{ name: "Home", item: "/" }, { name: "Testimonials", item: "/testimonials" }] as const;

export function TestimonialsPage({ testimonials }: { testimonials: PublishedTestimonial[] }) {
  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <section className="bg-charcoal pt-32 text-white sm:pt-36"><Container className="pb-16 lg:pb-20"><Breadcrumbs items={breadcrumbs.map((item) => ({ label: item.name, href: item.item }))} className="text-white/65" /><p className="mt-10 text-sm font-semibold uppercase tracking-[0.14em] text-brand">Testimonials</p><h1 className="mt-3 max-w-3xl font-heading text-4xl font-bold tracking-tight sm:text-5xl">Experiences shared by clients</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">Published feedback from clients and project partners.</p></Container></section>
      <Container className="py-16 lg:py-24">
        <SectionHeading eyebrow="Client perspective" title="What clients say" />
        {testimonials.length === 0 ? <div className="mt-10"><EmptyState title="Testimonials are on their way" description="We are preparing approved client feedback for this page. In the meantime, explore our services and project work." /></div> : <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{testimonials.map((testimonial) => { const rating = testimonial.rating; return <Card key={testimonial.id} className="flex h-full flex-col"><Quote className="text-brand-deep" size={28} aria-hidden="true" /><blockquote className="mt-5 flex-1 text-lg leading-8 text-ink">“{testimonial.quote}”</blockquote><div className="mt-7 border-t border-line pt-5"><p className="font-semibold">{testimonial.name}</p>{testimonial.roleOrOrg ? <p className="mt-1 text-sm text-ink-muted">{testimonial.roleOrOrg}</p> : null}{rating !== null ? <div className="mt-3 flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={16} className={index < rating ? "fill-brand text-brand-deep" : "text-line"} aria-hidden="true" />)}<Badge className="ml-2">{rating}/5</Badge></div> : null}{testimonial.project ? <p className="mt-3 text-xs text-ink-muted">Project: {testimonial.project.title}</p> : null}</div></Card>; })}</div>}
      </Container>
    </>
  );
}
