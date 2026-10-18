import Link from "next/link";
import { CloudImage } from "@/components/cloud-image";
import type { HomeWhySection } from "@/server/queries/home";
import type { PublishedTeamMember } from "@/server/queries/team";
import { Container } from "@/components/ui";

export function HomeWhy({ team, section }: { team: PublishedTeamMember[]; section: HomeWhySection | null }) {
  if (!section) return null;
  if (team.length === 0 && !section.title && !section.quote?.trim()) return null;
  const statement = section.quote?.trim() || section.title;

  return <section className="section-tint"><Container className="section-space-generous"><div className="mx-auto max-w-5xl text-center"><p className="eyebrow">{section.eyebrow || "Built around trust"}</p><blockquote className="mt-5 font-heading text-h2 font-semibold leading-tight tracking-[-0.04em] text-ink">{statement}</blockquote>{section.description ? <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-ink-muted">{section.description}</p> : null}<div className="mt-8 flex flex-wrap items-center justify-center gap-5"><div className="flex -space-x-3" aria-label="Visible team members">{team.slice(0, 5).map((member) => <span key={member.id} className="relative flex size-11 overflow-hidden rounded-full border-2 border-bg bg-bg" title={member.name}>{member.photo ? <CloudImage src={member.photo.url} alt="" fill sizes="44px" className="object-cover" /> : <span className="flex size-full items-center justify-center text-xs font-bold text-accent-ink" aria-hidden="true">{member.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</span>}</span>)}</div><Link href="/projects" className="inline-flex min-h-11 items-center rounded-control bg-bg px-5 font-semibold text-accent-ink transition-transform hover:-translate-y-0.5">View projects</Link></div></div></Container></section>;
}
