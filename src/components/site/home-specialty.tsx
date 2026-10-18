import { ArrowRight, BadgeCheck } from "lucide-react";
import type { HomeSpecialtySection } from "@/server/queries/home";
import type { PublishedService } from "@/server/queries/services";
import { RevealGroup } from "@/components/motion";
import { Container, Reveal } from "@/components/ui";

export function HomeSpecialty({ section, service }: { section: HomeSpecialtySection | null; service: PublishedService | null }) {
  const content = section ?? (service ? { eyebrow: "Structural repair & rehabilitation", title: service.title, description: service.shortDesc, ctaLabel: "Request Site Inspection", ctaHref: "/contact?type=inspection" } : null);
  if (!content) return null;
  const description = content.description || service?.shortDesc;
  const scope = service?.scopeItems.slice(0, 4) ?? [];
  const cards = [scope[0] ?? "Survey", scope[1] ?? "Repair audit", scope[2] ?? "Execution"];

  return <section className="section-dark overflow-hidden"><Container className="section-space-generous"><Reveal className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.75fr)] lg:items-center lg:gap-16"><div>
    {content.eyebrow ? <p className="eyebrow mb-4 text-accent-2">{content.eyebrow}</p> : null}
    <h2 className="max-w-3xl font-heading text-display font-semibold leading-[1.02] tracking-[-0.045em]">{content.title}</h2>
    {description ? <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">{description}</p> : null}
    <a href={content.ctaHref} className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-control bg-accent px-5 font-bold text-accent-ink transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-2">{content.ctaLabel}<ArrowRight size={18} aria-hidden="true" /></a>
    {scope.length ? <ul className="mt-8 grid gap-3 sm:grid-cols-2">{scope.map((item) => <li key={item} className="flex min-h-16 items-start gap-3 text-sm leading-6 text-white/85"><BadgeCheck size={18} className="mt-0.5 shrink-0 text-accent-2" aria-hidden="true" />{item}</li>)}</ul> : null}
  </div><RevealGroup className="grid gap-3">{cards.map((item, index) => <Reveal key={`${item}-${index}`}><div className="rounded-card border border-white/15 bg-white/5 p-5 shadow-soft backdrop-blur-sm"><p className="eyebrow text-accent-2">{String(index + 1).padStart(2, "0")}</p><p className="mt-3 font-heading text-xl font-semibold text-white">{item}</p></div></Reveal>)}</RevealGroup></Reveal></Container></section>;
}
