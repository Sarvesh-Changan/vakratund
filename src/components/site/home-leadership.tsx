import { CloudImage } from "@/components/cloud-image";
import type { PublishedTeamMember } from "@/server/queries/team";
import type { HomeWhySection } from "@/server/queries/home";
import type { ResolvedSiteSettings } from "@/config/site";
import { Card, Container, SectionHeading } from "@/components/ui";

export function HomeLeadership({ settings, team, quote }: { settings: ResolvedSiteSettings; team: PublishedTeamMember[]; quote?: HomeWhySection["quote"] }) {
  if (team.length === 0) return null;
  const approvedQuote = quote?.trim();
  return <section className="section-light"><Container className="section-space-generous"><SectionHeading eyebrow="Leadership" title={`${settings.businessName} team`} description={settings.tagline} />{approvedQuote ? <blockquote className="mx-auto mt-8 max-w-3xl text-center font-heading text-xl font-semibold leading-8 text-ink">“{approvedQuote}”</blockquote> : null}<div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{team.slice(0, 4).map((member) => <Card key={member.id} className="border-line bg-tint p-4"><div className="relative aspect-square overflow-hidden rounded-[1.75rem] bg-bg">{member.photo ? <CloudImage src={member.photo.url} alt={member.photo.alt} fill sizes="(min-width: 1024px) 20vw, (min-width: 640px) 45vw, 100vw" className="object-cover" /> : <div className="flex size-full items-center justify-center font-heading text-4xl font-bold text-accent" aria-hidden="true">{member.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</div>}</div><h3 className="mt-4 font-heading font-semibold text-ink">{member.name}</h3><p className="mt-1 text-sm text-accent-ink">{member.designation}</p>{member.qualification ? <p className="mt-1 text-xs text-ink-muted">{member.qualification}</p> : null}{member.experienceYrs !== null ? <p className="mt-2 text-xs text-ink-muted">{member.experienceYrs} years experience</p> : null}</Card>)}</div></Container></section>;
}
