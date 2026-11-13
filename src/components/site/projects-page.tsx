import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Container, SectionHeading } from "@/components/ui";
import type { PublishedProject } from "@/server/queries/projects";
import { ProjectsFilterGrid } from "./projects-filter-grid";

export function ProjectsPage({ projects }: { projects: PublishedProject[] }) {
  const breadcrumbs = [
    { name: "Home", item: "/" },
    { name: "Projects", item: "/projects" },
  ] as const;
  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <section className="section-tint">
        <Container className="pt-8 pb-16 md:pt-10 md:pb-24">
          <SectionHeading eyebrow="Selected work" title="Project experience" description={projects.length ? "Explore published delivery records by service, status and year." : undefined} /><div className="mt-10"><ProjectsFilterGrid projects={projects} /></div>
        </Container>
      </section>
    </>
  );
}
