import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Badge, Card, Container, EmptyState, SectionHeading } from "@/components/ui";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CloudImage } from "@/components/cloud-image";
import type { PublishedProject } from "@/server/queries/projects";

function cover(project: PublishedProject) {
  return project.media.find((media) => media.isCover && media.kind === "IMAGE") ?? project.media.find((media) => media.kind === "IMAGE");
}

export function ProjectsPage({ projects }: { projects: PublishedProject[] }) {
  const breadcrumbs = [{ name: "Home", item: "/" }, { name: "Projects", item: "/projects" }] as const;
  return <><BreadcrumbJsonLd items={breadcrumbs} /><section className="bg-charcoal pt-32 text-white sm:pt-36"><Container className="pb-16 lg:pb-20"><Breadcrumbs items={breadcrumbs.map((item) => ({ label: item.name, href: item.item }))} className="text-white/65" /><p className="mt-10 text-sm font-semibold uppercase tracking-[0.14em] text-brand">Projects</p><h1 className="mt-3 max-w-3xl font-heading text-4xl font-bold tracking-tight sm:text-5xl">Work grounded in delivery</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">Published project records from construction, turnkey development, repair surveys and rehabilitation work.</p></Container></section><Container className="py-16 lg:py-24"><SectionHeading eyebrow="Selected work" title="Project experience" description={projects.length ? `${projects.length} published project records.` : undefined} />{projects.length === 0 ? <div className="mt-10"><EmptyState title="Projects are being prepared" description="Published project records will appear here once they are available." /></div> : <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{projects.map((project) => { const image = cover(project); return <Card key={project.id} className="group relative h-full overflow-hidden p-0"><div className="relative aspect-[4/3] bg-charcoal">{image ? <CloudImage src={image.url} alt={image.alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center text-sm text-white/60">Project image coming soon</div>}</div><div className="p-6"><Badge variant={project.status === "COMPLETED" ? "success" : "warning"}>{project.status === "COMPLETED" ? "Completed" : "Ongoing"}</Badge><h2 className="mt-4 font-heading text-xl font-semibold"><Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0">{project.title}</Link></h2><p className="mt-3 text-sm leading-7 text-ink-muted">{project.summary}</p></div></Card>; })}</div>}</Container></>;
}
