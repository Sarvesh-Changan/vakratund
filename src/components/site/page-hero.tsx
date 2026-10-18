import type { ReactNode } from "react";
import { CloudImage } from "@/components/cloud-image";
import { Reveal } from "@/components/motion";
import { Breadcrumbs, Container, type Breadcrumb } from "@/components/ui";

type PageHeroProps = {
  breadcrumbs: Breadcrumb[];
  eyebrow: string;
  title: string;
  description?: string;
  image?: { url: string; alt: string } | null;
  compact?: boolean;
  children?: ReactNode;
};

export function PageHero({
  breadcrumbs,
  eyebrow,
  title,
  description,
  image = null,
  compact = false,
  children,
}: PageHeroProps) {
  return (
    <section className={`section-dark relative overflow-hidden ${compact ? "pt-24 sm:pt-28" : "pt-28 sm:pt-32"}`}>
      {image ? <CloudImage src={image.url} alt="" fill priority sizes="100vw" className="absolute inset-0 -z-20 object-cover opacity-30" /> : <div className="home-blueprint-pattern absolute inset-0 -z-20 opacity-30" aria-hidden="true" />}
      <div className="absolute inset-0 -z-10 bg-dark/85" aria-hidden="true" />
      <Container className={compact ? "section-space-compact" : "section-space-compact"}>
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
