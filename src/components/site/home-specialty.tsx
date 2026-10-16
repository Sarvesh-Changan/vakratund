import { ArrowRight, BadgeCheck } from "lucide-react";
import type { HomeSpecialtySection } from "@/server/queries/home";
import type { PublishedService } from "@/server/queries/services";
import { Container, Reveal } from "@/components/ui";

export function HomeSpecialty({ section, service }: { section: HomeSpecialtySection | null; service: PublishedService | null }) {
  if (!section) return null;
  const description = section.description || service?.shortDesc;
  const scope = service?.scopeItems.slice(0, 4) ?? [];

  return <section className="overflow-hidden bg-charcoal text-white"><Container className="section-space-generous"><Reveal className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.75fr)] lg:items-center lg:gap-16"><div>
    {section.eyebrow ? <p className="eyebrow mb-4 text-brand">{section.eyebrow}</p> : null}
    <h2 className="max-w-3xl font-heading text-display font-semibold leading-[1.02] tracking-[-0.045em]">{section.title}</h2>
    {description ? <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">{description}</p> : null}
    <a href={section.ctaHref} className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-control bg-brand px-5 font-bold text-brand-ink transition-colors hover:bg-brand/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">{section.ctaLabel}<ArrowRight size={18} aria-hidden="true" /></a>
  </div>{scope.length ? <ul className="grid gap-3 sm:grid-cols-2">{scope.map((item) => <li key={item} className="flex min-h-16 items-start gap-3 rounded-card border border-white/15 bg-white/5 p-4 text-sm leading-6 text-white/85"><BadgeCheck size={18} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />{item}</li>)}</ul> : null}</Reveal></Container></section>;
}
