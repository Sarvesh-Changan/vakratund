import { BadgeCheck } from "lucide-react";
import { CloudImage } from "@/components/cloud-image";
import type { ResolvedSiteSettings } from "@/config/site";
import type { HomeWhySection } from "@/server/queries/home";
import type { PublishedTeamMember } from "@/server/queries/team";
import { Card, Container, SectionHeading } from "@/components/ui";

function findProprietor(team: PublishedTeamMember[]): PublishedTeamMember | null {
  return team.find((member) => /proprietor/i.test(member.designation))
    ?? team.find((member) => /salil/i.test(member.name))
    ?? null;
}

export function HomeWhy({ settings, team, section }: { settings: ResolvedSiteSettings; team: PublishedTeamMember[]; section: HomeWhySection | null }) {
  if (!section) return null;
  const proprietor = findProprietor(team);
  const facts = [
    ...settings.credentials.slice(0, 2).map((credential) => ({ label: credential.label, value: credential.value })),
    ...(settings.foundedYear ? [{ label: "Established", value: `Since ${settings.foundedYear}` }] : []),
  ];
  if (!proprietor && facts.length === 0 && !section.quote?.trim()) return null;

  return <section className="bg-surface-alt"><Container className="section-space-generous"><div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,.95fr)] lg:items-start lg:gap-16">
    <div><SectionHeading eyebrow={section.eyebrow || undefined} title={section.title} description={section.description || undefined} />
      {proprietor ? <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center"><div className="relative aspect-[4/3] w-full overflow-hidden rounded-card bg-charcoal sm:aspect-square sm:w-44 sm:shrink-0">{proprietor.photo ? <CloudImage src={proprietor.photo.url} alt={proprietor.photo.alt} fill sizes="(min-width: 640px) 176px, 100vw" className="object-cover" /> : <div className="home-blueprint-pattern absolute inset-0" aria-hidden="true" />}</div><div><p className="font-heading text-2xl font-semibold text-ink">{proprietor.name}</p><p className="mt-1 font-medium text-brand-deep">{proprietor.designation}</p>{proprietor.qualification ? <p className="mt-1 text-sm text-ink-muted">{proprietor.qualification}</p> : null}{proprietor.bio ? <p className="mt-3 text-sm leading-7 text-ink-muted">{proprietor.bio}</p> : null}</div></div> : null}
      {section.quote?.trim() ? <blockquote className="mt-8 rounded-panel border-l-4 border-brand bg-surface p-6 font-heading text-lg leading-8 text-ink">“{section.quote.trim()}”</blockquote> : null}
    </div>
    {facts.length ? <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">{facts.map((fact) => <li key={`${fact.label}-${fact.value}`}><Card className="flex h-full items-start gap-4 p-5"><BadgeCheck className="mt-0.5 shrink-0 text-brand-deep" size={20} aria-hidden="true" /><div><h3 className="font-semibold text-ink">{fact.label}</h3><p className="mt-1 text-sm leading-6 text-ink-muted">{fact.value}</p></div></Card></li>)}</ul> : null}
  </div></Container></section>;
}
