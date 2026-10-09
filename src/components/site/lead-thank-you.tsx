import Link from "next/link";
import { ArrowRight, CheckCircle2, Download, MessageCircle, Phone } from "lucide-react";
import type { ResolvedSiteSettings } from "@/config/site";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs, Card, Container } from "@/components/ui";
import type { BreadcrumbItem } from "@/lib/seo/json-ld";
import { AnalyticsConversion } from "./analytics-conversion";
import { ContactLink, TrackedWhatsAppLink } from "./contact-link";
import { phoneHref } from "./contact-utils";

export function LeadThankYou({
  settings,
  eyebrow,
  title,
  description,
  downloadHref,
  projectName,
  estimateReference,
  breadcrumbs,
}: {
  settings: ResolvedSiteSettings;
  eyebrow: string;
  title: string;
  description: string;
  downloadHref?: string;
  projectName?: string;
  estimateReference?: string;
  breadcrumbs: readonly BreadcrumbItem[];
}) {
  const phone = settings.phones[0] ?? "";
  return (
    <><BreadcrumbJsonLd items={breadcrumbs} /><Container className="py-16 sm:py-24">
      <AnalyticsConversion events={["generate_lead"]} />
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs items={breadcrumbs.map((item) => ({ label: item.name, href: item.item }))} />
        <CheckCircle2 className="text-success" size={40} aria-hidden="true" />
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.16em] text-brand-deep">{eyebrow}</p>
        <h1 className="mt-4 font-heading text-4xl font-bold sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-muted">{description}</p>
        {downloadHref ? <Card className="mt-8 border-brand/30 bg-surface-alt"><h2 className="font-heading text-xl font-bold">Your company profile</h2><p className="mt-2 text-sm text-ink-muted">This download link expires in 10 minutes.</p><a href={downloadHref} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-control bg-brand px-5 font-bold text-brand-ink hover:bg-brand/90"><Download size={18} aria-hidden="true" /> Download brochure</a></Card> : null}
        <Card className="mt-8">
          <h2 className="font-heading text-xl font-bold">What happens next?</h2>
          <ol className="mt-5 grid gap-3 sm:grid-cols-3">
            <li className="rounded-control border bg-surface-alt p-4 text-sm text-ink-muted"><strong className="block text-ink">1. Review</strong>Our team reviews the details you shared.</li>
            <li className="rounded-control border bg-surface-alt p-4 text-sm text-ink-muted"><strong className="block text-ink">2. Discuss</strong>We clarify scope and project requirements.</li>
            <li className="rounded-control border bg-surface-alt p-4 text-sm text-ink-muted"><strong className="block text-ink">3. Plan</strong>We guide you to the right next step.</li>
          </ol>
        </Card>
        <div className="mt-8 flex flex-wrap gap-3">
          <ContactLink href={phoneHref(phone)} eventType="CALL" context="thank-you-call" className="inline-flex min-h-12 items-center gap-2 rounded-control border bg-surface px-5 font-semibold hover:bg-surface-alt"><Phone size={18} aria-hidden="true" /> Call us</ContactLink>
          <TrackedWhatsAppLink settings={settings} whatsappContext={{ pageTitle: title, projectName, estimateReference }} context="thank-you-whatsapp" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-control bg-[#25D366] px-5 font-semibold text-white hover:brightness-95"><MessageCircle size={18} aria-hidden="true" /> WhatsApp us</TrackedWhatsAppLink>
          <Link href="/" className="inline-flex min-h-12 items-center gap-2 rounded-control bg-brand px-5 font-bold text-brand-ink hover:bg-brand/90">Back to home <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
      </div>
    </Container></>
  );
}
