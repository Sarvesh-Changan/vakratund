"use client";

import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, MapPin } from "lucide-react";
import { useMemo, useState } from "react";

import { CloudImage } from "@/components/cloud-image";
import { HoverCard, MaskImage, Reveal, RevealGroup } from "@/components/motion";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import type { PublishedProject } from "@/server/queries/projects";
import { ServiceIcon } from "./service-icon";
import { FilterPanel } from "./filter-panel";

const PAGE_SIZE = 6;

function cover(project: PublishedProject) {
  return project.media.find((media) => media.isCover && media.kind === "IMAGE") ?? project.media.find((media) => media.kind === "IMAGE");
}

function projectMetric(project: PublishedProject): string {
  if (project.areaSqft) return `${project.areaSqft.toLocaleString("en-IN")} sq.ft`;
  if (project.floorsText) return project.floorsText;
  if (project.year) return String(project.year);
  return project.status === "ONGOING" ? "In progress" : "Published work";
}

export function ProjectsFilterGrid({ projects }: { projects: PublishedProject[] }) {
  const [service, setService] = useState("all");
  const [status, setStatus] = useState("all");
  const [year, setYear] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const services = useMemo(() => projects.flatMap((project) => project.service ? [{ slug: project.service.slug, title: project.service.title }] : []).filter((item, index, all) => all.findIndex((candidate) => candidate.slug === item.slug) === index), [projects]);
  const years = useMemo(() => [...new Set(projects.flatMap((project) => project.year ? [project.year] : []))].sort((a, b) => b - a), [projects]);
  const filtered = useMemo(() => projects.filter((project) => (service === "all" || project.service?.slug === service) && (status === "all" || project.status === status) && (year === "all" || String(project.year) === year)), [projects, service, status, year]);
  const visible = filtered.slice(0, visibleCount);

  function setFilter(setter: (value: string) => void, value: string): void {
    setter(value);
    setVisibleCount(PAGE_SIZE);
  }

  return <div>
    <FilterPanel className="mb-8">
      <div className="mb-8 rounded-panel border border-line bg-bg p-4 shadow-soft sm:p-5" aria-label="Filter projects">
        <div className="grid gap-3 lg:grid-cols-[6rem_1fr]">
          <p className="pt-2 text-sm font-semibold">Services</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[["all", "All", projects.length] as const, ...services.map((item) => [item.slug, item.title, projects.filter((project) => project.service?.slug === item.slug).length] as const)].map(([value, label, count]) => <button key={value} type="button" onClick={() => setFilter(setService, value)} aria-pressed={service === value} className={`inline-flex min-h-10 shrink-0 items-center rounded-pill border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${service === value ? "border-dark bg-dark text-white" : "border-line bg-bg text-accent-ink hover:bg-tint"}`}>{label}<span className="ml-2 text-xs opacity-70">{count}</span></button>)}
          </div>
          <p className="pt-2 text-sm font-semibold">Status</p>
          <div className="flex flex-wrap gap-2">
            {([["all", "All"], ["COMPLETED", "Completed"], ["ONGOING", "Ongoing"]] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(setStatus, value)} aria-pressed={status === value} className={`inline-flex min-h-10 items-center rounded-pill border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${status === value ? "border-dark bg-dark text-white" : "border-line bg-bg text-accent-ink hover:bg-tint"}`}>{label}</button>)}
          </div>
          {years.length > 0 ? <><p className="pt-2 text-sm font-semibold">Years</p><div className="flex flex-wrap gap-2">{[["all", "All", projects.length] as const, ...years.map((item) => [String(item), String(item), projects.filter((project) => project.year === item).length] as const)].map(([value, label, count]) => <button key={value} type="button" onClick={() => setFilter(setYear, value)} aria-pressed={year === value} className={`inline-flex min-h-10 items-center rounded-pill border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${year === value ? "border-dark bg-dark text-white" : "border-line bg-bg text-accent-ink hover:bg-tint"}`}>{label}<span className="ml-2 text-xs opacity-70">{count}</span></button>)}</div></> : null}
        </div>
      </div>
    </FilterPanel>
    {visible.length === 0 ? <EmptyState title="No projects match those filters" description="Try another service, status or year to explore the published portfolio." action={<Link href="/contact" className="inline-flex min-h-11 items-center rounded-pill bg-accent px-5 font-semibold text-accent-ink">Start a conversation <span className="ml-2" aria-hidden="true">{"\u2197"}</span></Link>} /> : <RevealGroup key={`${service}-${status}-${year}`} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((project) => { const image = cover(project); return <Reveal key={project.id}><HoverCard className="group h-full rounded-card"><Card className="relative h-full overflow-hidden border-line bg-bg p-0 shadow-soft"><Link href={`/projects/${project.slug}`} className="absolute inset-0 z-10" aria-label={`View project: ${project.title}`} /><MaskImage><div className="relative aspect-[4/3] overflow-hidden bg-dark">{image ? <CloudImage src={image.url} alt={image.alt} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw" data-hover-image className="object-cover transition-transform duration-700 group-hover:scale-105" /> : <div className="home-blueprint-pattern flex size-full items-center justify-center bg-gradient-to-br from-dark via-dark to-accent/30" aria-hidden="true"><span className="font-heading text-7xl font-bold tracking-[-0.08em] text-white/20">{project.year ?? "—"}</span><span className="absolute bottom-4 right-4 flex size-11 items-center justify-center rounded-full border border-accent-2/40 text-accent-2"><ServiceIcon iconKey={project.service?.slug ?? null} size={20} /></span></div>}<span className="absolute left-4 top-4"><Badge variant={project.status === "COMPLETED" ? "success" : "warning"}>{project.status === "COMPLETED" ? "Completed" : "Ongoing"}</Badge></span></div></MaskImage><div className="p-5"><div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted"><span className="inline-flex items-center gap-1"><BriefcaseBusiness size={14} aria-hidden="true" />{project.service?.title ?? "Project"}</span><span className="inline-flex items-center gap-1"><CalendarDays size={14} aria-hidden="true" />{project.year ?? "—"}</span></div><h2 className="mt-3 font-heading text-xl font-semibold text-ink">{project.title}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-muted">{project.summary}</p><div className="mt-5 flex items-center justify-between border-t border-line pt-4"><span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-ink"><MapPin size={15} aria-hidden="true" />{project.locationText ?? projectMetric(project)}</span><span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-ink transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true"><ArrowUpRight size={18} /></span></div></div></Card></HoverCard></Reveal>; })}
    </RevealGroup>}
    {visible.length < filtered.length ? <div className="mt-10 flex justify-center"><Button type="button" variant="outline-on-light" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>Load more projects</Button></div> : null}
  </div>;
}
