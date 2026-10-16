import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { HoverCard } from "@/components/motion";
import type { HomeProjectsSection } from "@/server/queries/home";
import type { PublishedProject } from "@/server/queries/projects";
import { Badge, Card, Container, Reveal, SectionHeading } from "@/components/ui";
import { CloudImage } from "@/components/cloud-image";

function projectStatus(status: PublishedProject["status"]): { label: string; variant: "success" | "warning" } {
  return status === "COMPLETED" ? { label: "Completed", variant: "success" } : { label: "Ongoing", variant: "warning" };
}

function projectMetric(project: PublishedProject): string | null {
  if (project.areaSqft) return `~${project.areaSqft.toLocaleString("en-IN")} sq.ft.`;
  return project.floorsText;
}

export function HomeProjects({ projects, section }: { projects: PublishedProject[]; section: HomeProjectsSection }) {
  if (projects.length === 0) return null;
  return <section className="bg-surface-alt"><Container className="section-space-generous">
    <SectionHeading eyebrow={section.eyebrow || undefined} title={section.title} description={section.description || undefined} action={<Link href="/projects" className="inline-flex min-h-11 items-center gap-2 self-start rounded-control font-semibold text-brand-deep hover:underline">{section.viewAllLabel}<ArrowUpRight size={17} aria-hidden="true" /></Link>} />
    <div className="mt-10 grid gap-6 md:grid-cols-2 lg:mt-14 lg:grid-cols-3">{projects.map((project) => {
      const cover = project.media.find((media) => media.isCover && media.kind === "IMAGE") ?? project.media.find((media) => media.kind === "IMAGE");
      const status = projectStatus(project.status);
      const metric = projectMetric(project);
      return <Reveal key={project.id}><HoverCard className="h-full rounded-card">
        <Card className="group relative h-full overflow-hidden p-0 shadow-soft">
          <div className="relative aspect-[4/3] overflow-hidden bg-charcoal">{cover ? <CloudImage src={cover.url} alt={cover.alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover" data-hover-image /> : <div className="home-blueprint-pattern absolute inset-0 bg-gradient-to-br from-charcoal via-charcoal to-brand-deep/35" aria-hidden="true" />}</div>
          <div className="p-6 sm:p-7">
            <div className="flex items-center justify-between gap-3">{project.service?.title ? <p className="eyebrow text-brand-deep">{project.service.title}</p> : <span />}{project.year ? <span className="text-xs text-ink-muted">{project.year}</span> : null}<Badge variant={status.variant}>{status.label}</Badge></div>
            {metric ? <p className="mt-4 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{metric}</p> : null}
            <h3 className="mt-3 font-heading text-h3 font-semibold"><Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0">{project.title}</Link></h3>
            <p className="mt-3 line-clamp-3 text-sm leading-7 text-ink-muted">{project.summary}</p>
            <div className="mt-5 flex justify-end text-xs font-medium text-ink-muted"><ArrowUpRight data-hover-arrow size={20} className="text-brand-deep" aria-hidden="true" /></div>
          </div>
        </Card>
      </HoverCard></Reveal>;
    })}</div>
  </Container></section>;
}
