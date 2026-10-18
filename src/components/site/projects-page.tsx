import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Container, CountUp, SectionHeading } from "@/components/ui";
import type { PublishedProject } from "@/server/queries/projects";
import { PageHero } from "./page-hero";
import { ProjectsFilterGrid } from "./projects-filter-grid";

export function ProjectsPage({ projects }: { projects: PublishedProject[] }) {
  const breadcrumbs = [
    { name: "Home", item: "/" },
    { name: "Projects", item: "/projects" },
  ] as const;
  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <PageHero
        breadcrumbs={breadcrumbs.map((item) => ({
          label: item.name,
          href: item.item,
        }))}
        eyebrow="Projects"
        title="Work grounded in delivery"
        description="Published project records from construction, turnkey development, repair surveys and rehabilitation work."
      />
      <section className="section-tint">
        <Container className="section-space-generous">
          <div className="grid gap-5 sm:grid-cols-3">
            {[{ label: "Published projects", value: projects.length }, { label: "Completed", value: projects.filter((project) => project.status === "COMPLETED").length }, { label: "Ongoing", value: projects.filter((project) => project.status === "ONGOING").length }].map((stat) => <div key={stat.label} className="rounded-card border border-line bg-bg p-5 shadow-soft"><p className="font-heading text-3xl font-bold text-accent-ink"><CountUp value={stat.value} format="number" /></p><p className="mt-1 text-sm text-ink-muted">{stat.label}</p></div>)}
          </div>
          <div className="mt-16"><SectionHeading eyebrow="Selected work" title="Project experience" description={projects.length ? "Explore published delivery records by service, status and year." : undefined} /><div className="mt-10"><ProjectsFilterGrid projects={projects} /></div></div>
        </Container>
      </section>
    </>
  );
}
