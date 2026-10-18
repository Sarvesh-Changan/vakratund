import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Container, SectionHeading } from "@/components/ui";
import type { PublishedService } from "@/server/queries/services";
import { PageHero } from "./page-hero";
import { ServicesFilterGrid } from "./services-filter-grid";

export function ServicesPage({ services }: { services: PublishedService[] }) {
  const breadcrumbs = [
    { name: "Home", item: "/" },
    { name: "Services", item: "/services" },
  ] as const;
  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <PageHero
        breadcrumbs={breadcrumbs.map((item) => ({
          label: item.name,
          href: item.item,
        }))}
        eyebrow="Services"
        title="Construction, repair and project management services"
        description="Explore the published services configured for M/s. Vakratund Construction."
        compact
      />

      <section className="section-tint">
        <Container className="section-space-generous">
          <SectionHeading
            eyebrow="What we do"
            title="Practical engineering for complex work"
            description="Choose a service to review its scope, process, related work and frequently asked questions."
          />
          <div className="mt-10"><ServicesFilterGrid services={services} /></div>
        </Container>
      </section>

      <section className="section-light"><Container className="section-space"><div className="mx-auto flex max-w-5xl flex-col gap-6 rounded-panel border border-line bg-bg p-7 shadow-soft sm:p-10 md:flex-row md:items-center md:justify-between"><div><p className="eyebrow">Need a starting point?</p><h2 className="mt-3 font-heading text-2xl font-semibold sm:text-3xl">Not sure which service you need?</h2><p className="mt-3 max-w-2xl text-ink-muted">Share the project context and use the available estimator or contact route to choose the next step.</p></div><div className="flex shrink-0 flex-col gap-3 sm:flex-row"><a href="/estimate" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-accent px-5 font-bold text-accent-ink">Open estimator <span aria-hidden="true">→</span></a><a href="/contact" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-line px-5 font-semibold text-ink">Contact us <span aria-hidden="true">→</span></a></div></div></Container></section>
    </>
  );
}
