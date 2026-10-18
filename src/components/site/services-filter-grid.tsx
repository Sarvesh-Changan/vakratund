"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { HoverCard, Reveal, RevealGroup } from "@/components/motion";
import { CloudImage } from "@/components/cloud-image";
import { Card, EmptyState } from "@/components/ui";
import { SERVICE_GROUPS } from "@/lib/validation/services";
import type { PublishedService } from "@/server/queries/services";
import { ServiceIcon } from "./service-icon";

export function ServicesFilterGrid({ services }: { services: PublishedService[] }) {
  const [activeGroup, setActiveGroup] = useState("All");
  const filtered = useMemo(() => activeGroup === "All" ? services : services.filter((service) => service.group === activeGroup), [activeGroup, services]);
  return <div>
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter services by group">{["All", ...SERVICE_GROUPS].map((group) => <button key={group} type="button" role="tab" aria-selected={activeGroup === group} onClick={() => setActiveGroup(group)} className={`min-h-11 rounded-pill border px-4 text-sm font-semibold transition-colors ${activeGroup === group ? "border-accent bg-accent text-accent-ink" : "border-line bg-bg text-ink-muted hover:border-accent hover:text-ink"}`}>{group}</button>)}</div>
    {filtered.length === 0 ? <div className="mt-10"><EmptyState title="No services in this group" description="Choose another group or return to all services." /></div> : <RevealGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((service) => <Reveal key={service.id}><HoverCard className="group h-full rounded-card"><Card className="relative h-full overflow-hidden border-line bg-bg p-0 shadow-soft"><Link href={`/services/${service.slug}`} className="absolute inset-0 z-10" aria-label={`View ${service.title}`} /><div className="relative aspect-[4/3] overflow-hidden bg-tint">{service.cover ? <CloudImage src={service.cover.url} alt={service.cover.alt} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="home-blueprint-pattern flex size-full items-center justify-center bg-gradient-to-br from-tint via-bg to-accent/15"><span className="flex size-14 items-center justify-center rounded-full bg-accent/20 text-accent-ink"><ServiceIcon iconKey={service.iconKey} size={26} /></span></div>}</div><div className="p-5"><div className="flex items-center justify-between gap-3"><span className="eyebrow">{service.group || "Service"}</span><span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-ink transition-transform duration-300 group-hover:translate-x-1"><ArrowRight size={18} aria-hidden="true" /></span></div><h2 className="mt-4 font-heading text-xl font-semibold">{service.title}</h2><p className="mt-3 text-sm leading-7 text-ink-muted">{service.shortDesc}</p></div></Card></HoverCard></Reveal>)}</RevealGroup>}
  </div>;
}
