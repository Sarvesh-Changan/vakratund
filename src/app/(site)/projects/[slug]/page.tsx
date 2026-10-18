import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CloudImage } from "@/components/cloud-image";
import {
  MaskImage,
  Parallax,
  Reveal,
  RevealGroup,
} from "@/components/motion";
import { ProjectEnquiryCta } from "@/components/site/project-enquiry-cta";
import { ProjectBeforeAfter } from "@/components/site/project-before-after";
import { ProjectMediaLightbox } from "@/components/site/project-media-lightbox";
import { BreadcrumbJsonLd, CreativeWorkJsonLd } from "@/components/seo/json-ld";
import {
  Badge,
  Breadcrumbs,
  Card,
  Container,
  SectionHeading,
} from "@/components/ui";
import { MarkdownRenderer } from "@/lib/markdown/renderer";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  getPublishedProject,
  getPublishedProjects,
} from "@/server/queries/projects";

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    return (await getPublishedProjects()).map((project) => ({
      slug: project.slug,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProject(slug).catch(() => null);
  if (!project)
    return buildMetadata({
      path: `/projects/${slug}`,
      fallbackTitle: "Project not found",
      fallbackDescription:
        "The requested Vakratund Construction project is not published.",
      noIndex: true,
    });
  return buildMetadata({
    path: `/projects/${project.slug}`,
    fallbackTitle: project.title,
    fallbackDescription: project.seoDesc ?? project.summary,
    entitySeo: { seoTitle: project.seoTitle, seoDesc: project.seoDesc },
  });
}

export default async function ProjectRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getPublishedProject(slug).catch(() => null);
  if (!project) notFound();
  const images = project.media.filter((media) => media.kind === "IMAGE");
  const before = project.media.find((media) => media.isBefore && media.kind === "IMAGE");
  const after = project.media.find((media) => media.isAfter && media.kind === "IMAGE");
  const relatedProjects = (await getPublishedProjects()).filter((item) => item.slug !== project.slug && (item.service?.slug === project.service?.slug || item.locationText === project.locationText)).slice(0, 3);
  const breadcrumbs = [
    { name: "Home", item: "/" },
    { name: "Projects", item: "/projects" },
    { name: project.title, item: `/projects/${project.slug}` },
  ] as const;
  return (
    <>
      <CreativeWorkJsonLd
        project={{
          name: project.title,
          description: project.description ?? project.summary,
          slug: project.slug,
          image: images[0]?.url,
          location: project.locationText,
          serviceName: project.service?.title,
          clientName: project.clientName,
          year: project.year,
          creatorName: "M/s. Vakratund Construction",
        }}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <section className="section-dark relative overflow-hidden pt-28 sm:pt-32">
        {images[0] ? <div className="absolute inset-0 -z-10 opacity-25"><Parallax className="absolute inset-[-5%]" speed={0.08}><CloudImage src={images[0].url} alt="" fill sizes="100vw" priority className="object-cover" /></Parallax></div> : <div className="home-blueprint-pattern absolute inset-0 -z-10 opacity-30" aria-hidden="true" />}
        <div className="absolute inset-0 -z-10 bg-dark/85" aria-hidden="true" />
        <Container className="section-space-compact">
          <Reveal>
            <Breadcrumbs
              items={breadcrumbs.map((item) => ({
                label: item.name,
                href: item.item,
              }))}
              className="text-white/65"
            />
            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,34rem)] lg:items-end lg:gap-16">
              <div>
                <p className="eyebrow mb-4 text-brand">Project case study</p>
                <Badge
                  className="text-white"
                  variant={
                    project.status === "COMPLETED" ? "success" : "warning"
                  }
                >
                  {project.status === "COMPLETED" ? "Completed" : "Ongoing"}
                </Badge>
                <h1 className="mt-5 max-w-4xl font-heading text-h1 font-semibold leading-[1.04] tracking-[-0.045em]">
                  {project.title}
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">
                  {project.summary}
                </p>
              </div>
              {images[0] ? (
                <MaskImage className="rounded-panel">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-panel bg-white/10">
                    <Parallax className="absolute inset-0" speed={0.12}>
                      <CloudImage
                        src={images[0].url}
                        alt={images[0].alt}
                        fill
                        sizes="(min-width: 1024px) 45vw, 100vw"
                        priority
                        className="object-cover"
                      />
                    </Parallax>
                  </div>
                </MaskImage>
              ) : <div className="home-blueprint-pattern flex aspect-[4/3] items-center justify-center rounded-panel border border-white/10 bg-dark/50" aria-label="Project image coming soon"><span className="font-heading text-[clamp(5rem,16vw,12rem)] font-bold tracking-[-0.08em] text-white/15">{project.year ?? "—"}</span></div>}
            </div>
          </Reveal>
        </Container>
      </section>
      <Container className="section-light py-14 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-16">
          <article className="min-w-0">
            <Link
              href="/projects"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-deep hover:underline"
            >
              <ArrowLeft size={16} aria-hidden="true" /> Back to projects
            </Link>
            <section className="mt-10 rounded-panel border border-line bg-tint p-5 lg:sticky lg:top-28">
              <SectionHeading
                eyebrow="Project facts"
                title="Scope and delivery"
              />
              <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  ["Location", project.locationText],
                  [
                    "Area",
                    project.areaSqft
                      ? `${project.areaSqft.toLocaleString("en-IN")} sq.ft`
                      : null,
                  ],
                  ["Floors", project.floorsText],
                  ["Scope", project.scopeText],
                  ["Status", project.status === "COMPLETED" ? "Completed" : "Ongoing"],
                  ["Year", project.year?.toString()],
                ]
                  .filter((entry): entry is [string, string] =>
                    Boolean(entry[1]),
                  )
                  .map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-card border bg-surface p-4"
                    >
                      <dt className="text-sm text-ink-muted">{label}</dt>
                      <dd className="mt-1 font-semibold">{value}</dd>
                    </div>
                  ))}
              </dl>
              {project.status === "ONGOING" && project.progressPct !== null ? <div className="mt-6 border-t border-line pt-5"><div className="flex justify-between gap-3 text-sm font-semibold"><span>Progress</span><span>{Math.max(0, Math.min(100, project.progressPct))}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-pill bg-bg"><div className="h-full rounded-pill bg-accent" style={{ width: `${Math.max(0, Math.min(100, project.progressPct))}%` }} /></div></div> : null}
            </section>
            {project.description ? (
              <MarkdownRenderer
                content={project.description}
                className="prose prose-slate mt-12 max-w-none leading-8 text-ink-muted prose-headings:font-heading prose-headings:text-ink prose-a:text-brand-deep"
              />
            ) : null}
            {before && after ? <section className="mt-14"><SectionHeading eyebrow="Transformation" title="Before and after" /><div className="mt-8"><ProjectBeforeAfter before={before} after={after} /></div></section> : null}
            {images.length > 0 ? (
              <section className="mt-14">
                <SectionHeading eyebrow="Gallery" title="Project images" />
                <div className="mt-8"><ProjectMediaLightbox images={images} /></div>
              </section>
            ) : null}
          </article>
          <aside className="lg:sticky lg:top-28">
            <Card className="border-brand/30 bg-brand/10">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-deep">
                Next step
              </p>
              <h2 className="mt-3 font-heading text-2xl font-semibold">
                Planning similar work?
              </h2>
              <p className="mt-3 text-sm leading-7 text-ink-muted">
                Share your requirement and reference this project in your
                enquiry.
              </p>
              <div className="mt-6">
                <ProjectEnquiryCta slug={project.slug} title={project.title} />
              </div>
            </Card>
          </aside>
        </div>
      </Container>
      {relatedProjects.length > 0 ? <section className="section-tint"><Container className="section-space"><SectionHeading eyebrow="Continue exploring" title="Related projects" /><RevealGroup className="mt-8 grid gap-5 md:grid-cols-3">{relatedProjects.map((item) => <Reveal key={item.id}><Link href={`/projects/${item.slug}`} className="group block rounded-card border border-line bg-bg p-5 shadow-soft focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"><p className="eyebrow">{item.service?.title ?? "Project"}</p><h2 className="mt-3 font-heading text-xl font-semibold">{item.title}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-muted">{item.summary}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent-ink">View project <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">↗</span></span></Link></Reveal>)}</RevealGroup></Container></section> : null}
    </>
  );
}
