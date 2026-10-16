import type { ReactNode } from "react";
import { Reveal } from "@/components/motion";
import { Breadcrumbs, Container, type Breadcrumb } from "@/components/ui";

type PageHeroProps = {
  breadcrumbs: Breadcrumb[];
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
};

export function PageHero({
  breadcrumbs,
  eyebrow,
  title,
  description,
  children,
}: PageHeroProps) {
  return (
    <section className="bg-charcoal pt-28 text-white sm:pt-32">
      <Container className="section-space-compact">
      <Reveal>
          <Breadcrumbs items={breadcrumbs} className="text-white/65" />
          <div className="mt-10 max-w-5xl">
            <p className="eyebrow text-brand">{eyebrow}</p>
            <h1 className="mt-4 max-w-5xl font-heading text-h1 font-semibold leading-[1.04] tracking-[-0.045em]">
              {title}
            </h1>
            {description ? (
              <p className="mt-5 max-w-3xl text-lg leading-8 text-white/75">
                {description}
              </p>
            ) : null}
            {children}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
