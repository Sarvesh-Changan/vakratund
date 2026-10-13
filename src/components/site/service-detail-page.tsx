import { ArrowRight, Check, ExternalLink } from "lucide-react";
import Link from "next/link";

import { CloudImage } from "@/components/cloud-image";
import { CloudVideoPoster } from "@/components/cloud-video-poster";
import { FaqPageJsonLd, BreadcrumbJsonLd, ServiceJsonLd } from "@/components/seo/json-ld";
import { Accordion, AccordionItem, Badge, Breadcrumbs, Card, Container, SectionHeading } from "@/components/ui";
import { MarkdownRenderer } from "@/lib/markdown/renderer";
import type { ResolvedSiteSettings } from "@/config/site";
import type { PublishedServiceDetail } from "@/server/queries/service-detail";
import type { PublishedProject } from "@/server/queries/projects";
import { ServiceIcon } from "./service-icon";

const processSteps = ["Survey", "Plan", "Execute", "Handover"] as const;

function ctaFor(pricingMode: PublishedServiceDetail["service"]["pricingMode"]): { label: string; href: string } {
  return pricingMode === "INSPECTION_ONLY" ? { label: "Request Site Inspection", href: "/contact?type=inspection" } : { label: "Get Free Quote", href: "/estimate" };
}

function projectCover(project: PublishedProject) {
  return project.media.find((media) => media.isCover && media.kind === "IMAGE") ?? project.media.find((media) => media.kind === "IMAGE");
}

function ProjectCard({ project }: { project: PublishedProject }) {
  const cover = projectCover(project);
  const status = project.status === "COMPLETED" ? { label: "Completed", variant: "success" as const } : { label: "Ongoing", variant: "warning" as const };

  return (
    <Card className="group relative h-full overflow-hidden p-0">
      <div className="relative aspect-[4/3] overflow-hidden bg-charcoal">
        {cover ? <CloudImage src={cover.url} alt={cover.alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center text-sm text-white/60">Project image coming soon</div>}
      </div>
      <div className="p-5">
        <Badge variant={status.variant}>{status.label}</Badge>
        <h3 className="mt-3 font-heading text-xl font-semibold"><Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0">{project.title}</Link></h3>
        <p className="mt-2 text-sm leading-7 text-ink-muted">{project.summary}</p>
      </div>
    </Card>
  );
}

export function ServiceDetailPage({ detail, settings }: { detail: PublishedServiceDetail; settings: ResolvedSiteSettings }) {
  const { service, relatedProjects, gallery, faqs } = detail;
  const cta = ctaFor(service.pricingMode);
  const breadcrumbs = [{ name: "Home", item: "/" }, { name: "Services", item: "/services" }, { name: service.title, item: `/services/${service.slug}` }] as const;

  return (
    <>
      <ServiceJsonLd service={{ name: service.title, description: service.shortDesc, slug: service.slug, image: service.cover?.url, providerName: settings.businessName }} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      {faqs.length > 0 ? <FaqPageJsonLd faqs={faqs.map((faq) => ({ question: faq.question, answer: faq.answer }))} /> : null}

      <section className="bg-charcoal pt-28 text-white sm:pt-32">
        <Container className="pb-14 lg:pb-20">
          <Breadcrumbs items={breadcrumbs.map((item) => ({ label: item.name, href: item.item }))} className="text-white/65" />
          <div className="mt-10 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,28rem)] lg:gap-16">
            <div>
              <div className="flex size-14 items-center justify-center rounded-card bg-brand text-brand-ink"><ServiceIcon iconKey={service.iconKey} size={28} /></div>
              <h1 className="mt-6 max-w-3xl font-heading text-4xl font-bold tracking-tight sm:text-5xl">{service.title}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">{service.shortDesc}</p>
              <Link href={cta.href} className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-brand px-6 font-bold text-brand-ink transition-colors hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2">{cta.label} <ArrowRight size={18} aria-hidden="true" /></Link>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-white/10 bg-white/5">
              {service.cover ? <CloudImage src={service.cover.url} alt={service.cover.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" priority className="object-cover" /> : <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/60">Service image coming soon</div>}
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-14 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-16">
          <div className="min-w-0 space-y-16">
            <section>
              <SectionHeading eyebrow="Overview" title="About this service" />
              <MarkdownRenderer content={service.description} className="prose prose-slate mt-6 max-w-none leading-8 text-ink-muted prose-headings:font-heading prose-headings:text-ink prose-a:text-brand-deep" />
            </section>

            {service.scopeItems.length > 0 ? <section><SectionHeading eyebrow="Scope" title="What we do" /><ul className="mt-6 grid gap-3 sm:grid-cols-2">{service.scopeItems.map((item) => <li key={item} className="flex items-start gap-3 rounded-control border bg-surface p-4 text-sm leading-6 text-ink-muted"><Check size={18} className="mt-0.5 shrink-0 text-brand-deep" aria-hidden="true" />{item}</li>)}</ul></section> : null}

            <section><SectionHeading eyebrow="Approach" title="A clear process from survey to handover" /><ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{processSteps.map((step, index) => <li key={step} className="relative rounded-card border bg-surface p-5"><span className="text-sm font-semibold text-brand-deep">0{index + 1}</span><h3 className="mt-3 font-heading text-lg font-semibold">{step}</h3></li>)}</ol></section>

            {relatedProjects.length > 0 ? <section><SectionHeading eyebrow="Selected work" title="Related projects" /><div className="mt-8 grid gap-6 md:grid-cols-2">{relatedProjects.map((project) => <ProjectCard key={project.id} project={project} />)}</div></section> : null}

            {gallery.length > 0 ? <section><SectionHeading eyebrow="Gallery" title="Work in focus" /><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{gallery.map((item) => <figure key={item.id} className="overflow-hidden rounded-card border bg-surface"><div className="relative aspect-[4/3] bg-surface-alt">{item.mediaType === "VIDEO" ? <CloudVideoPoster src={item.url} alt={`Video poster: ${item.title}`} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw" className="object-cover" /> : <CloudImage src={item.url} alt={item.title} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />}</div><figcaption className="p-3 text-sm text-ink-muted">{item.title}</figcaption></figure>)}</div></section> : null}

            {faqs.length > 0 ? <section><SectionHeading eyebrow="FAQs" title="Questions about this service" /><div className="mt-8"><Accordion>{faqs.map((faq, index) => <AccordionItem key={faq.id} title={faq.question} defaultOpen={index === 0}><MarkdownRenderer content={faq.answer} className="prose prose-sm max-w-none leading-7 prose-a:text-brand-deep" /></AccordionItem>)}</Accordion></div></section> : null}
          </div>

          <aside className="lg:sticky lg:top-28">
            <Card className="border-brand/30 bg-brand/10">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-deep">Next step</p>
              <h2 className="mt-3 font-heading text-2xl font-semibold text-ink">Discuss your requirement</h2>
              <p className="mt-3 text-sm leading-7 text-ink-muted">Share the project details and the team will guide you to the right next step.</p>
              <Link href={cta.href} className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-brand px-4 text-sm font-bold text-brand-ink hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-brand-deep focus-visible:outline-offset-2">{cta.label} <ArrowRight size={16} aria-hidden="true" /></Link>
              <Link href="/contact" className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control border border-line bg-surface px-4 text-sm font-semibold text-ink hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-brand-deep focus-visible:outline-offset-2">Contact us <ExternalLink size={15} aria-hidden="true" /></Link>
            </Card>
          </aside>
        </div>
      </Container>
    </>
  );
}
