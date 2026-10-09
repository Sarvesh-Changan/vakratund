import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CloudImage } from "@/components/cloud-image";
import { ProjectEnquiryCta } from "@/components/site/project-enquiry-cta";
import { BreadcrumbJsonLd, CreativeWorkJsonLd } from "@/components/seo/json-ld";
import { Badge, Breadcrumbs, Card, Container, SectionHeading } from "@/components/ui";
import { MarkdownRenderer } from "@/lib/markdown/renderer";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPublishedProject, getPublishedProjects } from "@/server/queries/projects";

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    return (await getPublishedProjects()).map((project) => ({ slug: project.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProject(slug).catch(() => null);
  if (!project) return buildMetadata({ path: `/projects/${slug}`, fallbackTitle: "Project not found", fallbackDescription: "The requested Vakratund Construction project is not published.", noIndex: true });
  return buildMetadata({ path: `/projects/${project.slug}`, fallbackTitle: project.title, fallbackDescription: project.seoDesc ?? project.summary, entitySeo: { seoTitle: project.seoTitle, seoDesc: project.seoDesc } });
}

export default async function ProjectRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getPublishedProject(slug).catch(() => null);
  if (!project) notFound();
  const images = project.media.filter((media) => media.kind === "IMAGE");
  const breadcrumbs = [{ name: "Home", item: "/" }, { name: "Projects", item: "/projects" }, { name: project.title, item: `/projects/${project.slug}` }] as const;
  return <><CreativeWorkJsonLd project={{ name: project.title, description: project.description ?? project.summary, slug: project.slug, image: images[0]?.url, location: project.locationText, serviceName: project.service?.title, clientName: project.clientName, year: project.year, creatorName: "M/s. Vakratund Construction" }} /><BreadcrumbJsonLd items={breadcrumbs} /><section className="bg-charcoal pt-28 text-white sm:pt-32"><Container className="pb-14 lg:pb-20"><Breadcrumbs items={breadcrumbs.map((item) => ({ label: item.name, href: item.item }))} className="text-white/65" /><div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,34rem)] lg:items-end lg:gap-16"><div><Badge variant={project.status === "COMPLETED" ? "success" : "warning"}>{project.status === "COMPLETED" ? "Completed" : "Ongoing"}</Badge><h1 className="mt-5 max-w-3xl font-heading text-4xl font-bold tracking-tight sm:text-5xl">{project.title}</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">{project.summary}</p></div>{images[0] ? <div className="relative aspect-[4/3] overflow-hidden rounded-panel bg-white/10"><CloudImage src={images[0].url} alt={images[0].alt} fill sizes="(min-width: 1024px) 45vw, 100vw" priority className="object-cover" /></div> : null}</div></Container></section><Container className="py-14 lg:py-24"><div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-16"><article className="min-w-0"><Link href="/projects" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-deep hover:underline"><ArrowLeft size={16} aria-hidden="true" /> Back to projects</Link><section className="mt-10"><SectionHeading eyebrow="Project facts" title="Scope and delivery" /><dl className="mt-6 grid gap-3 sm:grid-cols-2">{[["Location", project.locationText], ["Area", project.areaSqft ? `${project.areaSqft.toLocaleString("en-IN")} sq.ft` : null], ["Floors", project.floorsText], ["Scope", project.scopeText], ["Year", project.year?.toString()]].filter((entry): entry is [string, string] => Boolean(entry[1])).map(([label, value]) => <div key={label} className="rounded-card border bg-surface p-4"><dt className="text-sm text-ink-muted">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}</dl></section>{project.description ? <MarkdownRenderer content={project.description} className="prose prose-slate mt-12 max-w-none leading-8 text-ink-muted prose-headings:font-heading prose-headings:text-ink prose-a:text-brand-deep" /> : null}{images.length > 1 ? <section className="mt-14"><SectionHeading eyebrow="Gallery" title="Project images" /><div className="mt-8 grid gap-4 sm:grid-cols-2">{images.slice(1).map((image) => <figure key={image.id} className="relative aspect-[4/3] overflow-hidden rounded-card bg-surface-alt"><CloudImage src={image.url} alt={image.alt} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" /></figure>)}</div></section> : null}</article><aside className="lg:sticky lg:top-28"><Card className="border-brand/30 bg-brand/10"><p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-deep">Next step</p><h2 className="mt-3 font-heading text-2xl font-semibold">Planning similar work?</h2><p className="mt-3 text-sm leading-7 text-ink-muted">Share your requirement and reference this project in your enquiry.</p><div className="mt-6"><ProjectEnquiryCta slug={project.slug} title={project.title} /></div></Card></aside></div></Container></>;
}
