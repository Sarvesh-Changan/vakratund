import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { HoverCard, Reveal, RevealGroup } from "@/components/motion";
import { Card, Container, EmptyState, SectionHeading } from "@/components/ui";
import type { PublishedService } from "@/server/queries/services";
import { ServiceIcon } from "./service-icon";
import { PageHero } from "./page-hero";

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
      />

      <section className="bg-bg">
        <Container className="py-16 lg:py-24">
          <SectionHeading
            eyebrow="What we do"
            title="Practical engineering for complex work"
            description="Choose a service to review its scope, process, related work and frequently asked questions."
          />
          {services.length === 0 ? (
            <div className="mt-10">
              <EmptyState
                title="Services are being prepared"
                description="Published service information will appear here once it is available."
              />
            </div>
          ) : (
            <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <Reveal key={service.id}>
                  <HoverCard className="h-full">
                    <Card className="group relative h-full">
                      <div className="flex size-12 items-center justify-center rounded-control bg-brand/15 text-brand-deep">
                        <ServiceIcon iconKey={service.iconKey} />
                      </div>
                      <h2 className="mt-5 font-heading text-xl font-semibold">
                        <Link
                          href={`/services/${service.slug}`}
                          className="after:absolute after:inset-0"
                        >
                          {service.title}
                        </Link>
                      </h2>
                      <p className="mt-3 text-sm leading-7 text-ink-muted">
                        {service.shortDesc}
                      </p>
                      <span className="relative mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-deep">
                        View service{" "}
                        <ArrowRight
                          size={16}
                          aria-hidden="true"
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </span>
                    </Card>
                  </HoverCard>
                </Reveal>
              ))}
            </RevealGroup>
          )}
        </Container>
      </section>
    </>
  );
}
