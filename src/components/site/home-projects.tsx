import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { PublishedProject } from "@/server/queries/projects";
import { Badge, Card, Container, Reveal, SectionHeading } from "@/components/ui";
import { CloudImage } from "@/components/cloud-image";

function projectStatus(status: PublishedProject["status"]): { label: string; variant: "success" | "warning" } {
  return status === "COMPLETED" ? { label: "Completed", variant: "success" } : { label: "Ongoing", variant: "warning" };
}

export function HomeProjects({ projects }: { projects: PublishedProject[] }) {
  if (projects.length === 0) return null;
  return <section className="bg-surface-alt"><Container className="py-20 lg:py-28"><SectionHeading eyebrow="Selected work" title="Projects grounded in delivery" description="Published project records from construction, turnkey development, repair surveys and rehabilitation work." action={<Link href="/projects" className="inline-flex min-h-11 items-center gap-2 self-start rounded-control font-semibold text-brand-deep hover:underline">View projects <ArrowRight size={17} aria-hidden="true" /></Link>} /><div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{projects.map((project) => { const cover = project.media.find((media) => media.isCover && media.kind === "IMAGE") ?? project.media.find((media) => media.kind === "IMAGE"); const status = projectStatus(project.status); return <Reveal key={project.id}><Card className="group relative h-full overflow-hidden p-0"><div className="relative aspect-[4/3] overflow-hidden bg-charcoal">{cover ? <CloudImage src={cover.url} alt={cover.alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center text-sm text-white/60">Project image coming soon</div>}</div><div className="p-6"><div className="flex items-center justify-between gap-3"><Badge variant={status.variant}>{status.label}</Badge>{project.year ? <span className="text-xs text-ink-muted">{project.year}</span> : null}</div><h3 className="mt-4 font-heading text-xl font-semibold"><Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0">{project.title}</Link></h3><p className="mt-3 text-sm leading-7 text-ink-muted">{project.summary}</p>{project.locationText ? <p className="mt-4 text-xs font-medium text-ink-muted">{project.locationText}</p> : null}</div></Card></Reveal>; })}</div></Container></section>;
}
