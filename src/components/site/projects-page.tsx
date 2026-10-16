import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { HoverCard, MaskImage, Reveal, RevealGroup } from "@/components/motion";
import {
  Badge,
  Card,
  Container,
  EmptyState,
  SectionHeading,
} from "@/components/ui";
import { CloudImage } from "@/components/cloud-image";
import type { PublishedProject } from "@/server/queries/projects";
import { PageHero } from "./page-hero";

function cover(project: PublishedProject) {
  return (
    project.media.find((media) => media.isCover && media.kind === "IMAGE") ??
    project.media.find((media) => media.kind === "IMAGE")
  );
}

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
      <section className="bg-surface-alt">
        <Container className="section-space-generous">
          <SectionHeading
            eyebrow="Selected work"
            title="Project experience"
            description={
              projects.length
                ? `${projects.length} published project records.`
                : undefined
            }
          />
          {projects.length === 0 ? (
            <div className="mt-10">
              <EmptyState
                title="Projects are being prepared"
                description="Published project records will appear here once they are available."
              />
            </div>
          ) : (
            <RevealGroup className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => {
                const image = cover(project);
                return (
                  <Reveal key={project.id}>
                    <HoverCard className="h-full">
                      <Card className="group relative h-full overflow-hidden p-0">
                        <MaskImage>
                          <div className="relative aspect-[4/3] bg-charcoal">
                            {image ? (
                              <CloudImage
                                src={image.url}
                                alt={image.alt}
                                fill
                                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                                data-hover-image
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-sm text-white/60">
                                Project image coming soon
                              </div>
                            )}
                          </div>
                        </MaskImage>
                        <div className="p-6">
                          <Badge
                            variant={
                              project.status === "COMPLETED"
                                ? "success"
                                : "warning"
                            }
                          >
                            {project.status === "COMPLETED"
                              ? "Completed"
                              : "Ongoing"}
                          </Badge>
                          <h2 className="mt-4 font-heading text-h3 font-semibold">
                            <Link
                              href={`/projects/${project.slug}`}
                              className="after:absolute after:inset-0"
                            >
                              {project.title}
                            </Link>
                          </h2>
                          <p className="mt-3 text-sm leading-7 text-ink-muted">
                            {project.summary}
                          </p>
                          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-deep">
                            View project{" "}
                            <ArrowRight
                              size={16}
                              data-hover-arrow
                              aria-hidden="true"
                            />
                          </span>
                        </div>
                      </Card>
                    </HoverCard>
                  </Reveal>
                );
              })}
            </RevealGroup>
          )}
        </Container>
      </section>
    </>
  );
}
