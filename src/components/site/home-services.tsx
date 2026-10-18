import type { LucideIcon } from "lucide-react";
import { ArrowRight, Building2, Droplets, Hammer, House, Paintbrush, Road, Ruler, ShieldCheck, Sprout, Wrench } from "lucide-react";
import Link from "next/link";
import { HoverCard, Marquee, RevealGroup } from "@/components/motion";
import type { PublishedService } from "@/server/queries/services";
import type { HomeServicesSection } from "@/server/queries/home";
import { Card, Container, GlowBlob, Reveal, SectionHeading } from "@/components/ui";

const serviceIcons: Record<string, LucideIcon> = {
  "building-construction": Building2,
  "pmc-turnkey-project-development": Ruler,
  "redevelopment-project-management": House,
  "structural-repairs-rehabilitation": ShieldCheck,
  "piling-foundation": Sprout,
  "waterproofing-solutions": Droplets,
  "damp-proofing": Droplets,
  "painting-works": Paintbrush,
  "plumbing-drainage": Wrench,
  "interior-works": House,
  "road-works": Road,
  "fabrication-porta-house": Hammer,
};

export function HomeServices({ services, section }: { services: PublishedService[]; section: HomeServicesSection | null }) {
  if (services.length === 0) return null;
  const content = section ?? { eyebrow: "", title: "Services", description: "", viewAllLabel: "View all services", serviceLinkLabel: "View service" };
  return <section className="section-light relative overflow-hidden"><GlowBlob color="var(--glow-1)" className="-right-32 top-24" /><Container className="relative z-10 section-space-generous"><SectionHeading eyebrow={content.eyebrow || undefined} title={content.title} description={content.description || undefined} action={<Link href="/services" className="inline-flex min-h-11 items-center gap-2 self-start rounded-control font-semibold text-accent-ink hover:underline">{content.viewAllLabel} <ArrowRight size={17} aria-hidden="true" /></Link>} /><RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">{services.map((service) => { const Icon = serviceIcons[service.slug] ?? Building2; return <Reveal key={service.id}><HoverCard className="h-full rounded-card"><Card className="h-full border-line bg-tint shadow-soft"><div className="flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent-ink"><Icon size={22} aria-hidden="true" /></div><h3 className="mt-5 font-heading text-xl font-semibold"><Link href={`/services/${service.slug}`} className="focus-visible:underline">{service.title}</Link></h3><p className="mt-3 text-sm leading-7 text-ink-muted">{service.shortDesc}</p><Link href={`/services/${service.slug}`} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent-ink focus-visible:underline">{content.serviceLinkLabel}<ArrowRight size={16} aria-hidden="true" /></Link></Card></HoverCard></Reveal>; })}</RevealGroup></Container></section>;
}

export function HomeServiceMarquee({ services }: { services: PublishedService[] }) {
  if (services.length === 0) return null;
  return <section className="overflow-hidden border-y border-line bg-surface-alt py-5 sm:py-6"><Marquee label="Vakratund Construction services" durationSeconds={42}><div className="flex items-center gap-8 px-4 sm:gap-12">{services.map((service) => <span key={service.id} className="whitespace-nowrap font-heading text-lg font-semibold text-ink sm:text-xl">{service.title}</span>)}</div></Marquee></section>;
}
