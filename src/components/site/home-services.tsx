import type { LucideIcon } from "lucide-react";
import { ArrowRight, Building2, Droplets, Hammer, House, Paintbrush, Road, Ruler, ShieldCheck, Sprout, Wrench } from "lucide-react";
import Link from "next/link";
import type { PublishedService } from "@/server/queries/services";
import { Card, Container, Reveal, SectionHeading } from "@/components/ui";

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

export function HomeServices({ services }: { services: PublishedService[] }) {
  if (services.length === 0) return null;
  return <section className="bg-bg"><Container className="py-20 lg:py-28"><SectionHeading eyebrow="What we do" title="Practical engineering for complex work" description="Explore the construction, project management, repair, rehabilitation and maintenance services configured for Vakratund Construction." action={<Link href="/services" className="inline-flex min-h-11 items-center gap-2 self-start rounded-control font-semibold text-brand-deep hover:underline">View all services <ArrowRight size={17} aria-hidden="true" /></Link>} /><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{services.map((service) => { const Icon = serviceIcons[service.slug] ?? Building2; return <Reveal key={service.id}><Card className="group relative h-full transition-transform hover:-translate-y-1"><div className="flex size-11 items-center justify-center rounded-control bg-brand/15 text-brand-deep"><Icon size={22} aria-hidden="true" /></div><h3 className="mt-5 font-heading text-xl font-semibold"><Link href={`/services/${service.slug}`} className="after:absolute after:inset-0">{service.title}</Link></h3><p className="mt-3 text-sm leading-7 text-ink-muted">{service.shortDesc}</p><div className="relative mt-5 text-sm font-semibold text-brand-deep">Explore service <ArrowRight size={16} className="ml-1 inline transition-transform group-hover:translate-x-1" aria-hidden="true" /></div></Card></Reveal>; })}</div></Container></section>;
}
