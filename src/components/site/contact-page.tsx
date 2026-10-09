import { Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";

import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs, Card, Container, SectionHeading } from "@/components/ui";
import { formatBusinessHours } from "@/lib/site/business-hours";
import { phoneHref, whatsappHref } from "./contact-utils";
import { ContactLink, TrackedWhatsAppLink } from "./contact-link";
import { ContactForm } from "./contact-form";
import type { ResolvedSiteSettings } from "@/config/site";

const breadcrumbs = [{ name: "Home", item: "/" }, { name: "Contact", item: "/contact" }] as const;

export function ContactPage({ settings, projectPrefill, projectSlug }: { settings: ResolvedSiteSettings; projectPrefill?: string; projectSlug?: string }) {
  const hours = formatBusinessHours(settings.businessHours);
  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <section className="bg-charcoal pt-32 text-white sm:pt-36">
        <Container className="pb-16 lg:pb-20">
          <Breadcrumbs items={breadcrumbs.map((item) => ({ label: item.name, href: item.item }))} className="text-white/65" />
          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.14em] text-brand">Contact</p>
          <h1 className="mt-3 max-w-3xl font-heading text-4xl font-bold tracking-tight sm:text-5xl">Let’s discuss your project requirement</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">Share a few details and our team can understand the next useful step.</p>
        </Container>
      </section>

      <Container className="py-16 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)] lg:items-start lg:gap-12">
          <Card className="p-6 sm:p-8"><SectionHeading eyebrow="Send an enquiry" title="Tell us what you are planning" /><div className="mt-8"><ContactForm projectPrefill={projectPrefill} projectSlug={projectSlug} /></div></Card>
          <aside className="space-y-5" aria-label="Contact details">
            <Card className="bg-surface-alt"><h2 className="font-heading text-xl font-semibold">Talk to Vakratund</h2><ul className="mt-6 space-y-5 text-sm">
              {settings.phones.map((phone) => <li key={phone} className="flex gap-3"><Phone className="mt-1 shrink-0 text-brand-deep" size={18} aria-hidden="true" /><ContactLink href={phoneHref(phone)} eventType="CALL" context="contact-page-phone" className="font-semibold text-brand-deep underline-offset-4 hover:underline">{phone}</ContactLink></li>)}
              {whatsappHref(settings, { pageTitle: "Contact page" }) ? <li><TrackedWhatsAppLink settings={settings} whatsappContext={{ pageTitle: "Contact page" }} context="contact-page-whatsapp" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-control bg-brand px-4 font-semibold text-brand-ink hover:bg-brand/90"><MessageCircle size={18} aria-hidden="true" />Message us on WhatsApp</TrackedWhatsAppLink></li> : null}
              {settings.email ? <li className="flex gap-3"><Mail className="mt-1 shrink-0 text-brand-deep" size={18} aria-hidden="true" /><a href={`mailto:${settings.email}`} className="font-semibold text-brand-deep underline-offset-4 hover:underline">{settings.email}</a></li> : null}
              <li className="flex gap-3"><MapPin className="mt-1 shrink-0 text-brand-deep" size={18} aria-hidden="true" /><span>{settings.address}</span></li>
            </ul></Card>
            <Card><div className="flex items-center gap-3"><Clock3 className="text-brand-deep" size={20} aria-hidden="true" /><h2 className="font-heading text-xl font-semibold">Business hours</h2></div>{hours.length ? <dl className="mt-5 space-y-2 text-sm">{hours.map((entry) => <div key={entry.day} className="flex justify-between gap-4"><dt className="text-ink-muted">{entry.day}</dt><dd className="font-medium">{entry.value}</dd></div>)}</dl> : <p className="mt-4 text-sm text-ink-muted">Hours are available on request. Please call or message us.</p>}</Card>
          </aside>
        </div>

        <section className="mt-16" aria-label="Map and location">
          <SectionHeading eyebrow="Find us" title="Visit or plan a site discussion" />
          <div className="mt-8 overflow-hidden rounded-panel border bg-surface shadow-soft">
            {settings.mapEmbedUrl ? <iframe title={`${settings.businessName} location map`} src={settings.mapEmbedUrl} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" className="h-[22rem] w-full border-0" /> : <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-6 text-center"><MapPin className="text-brand-deep" size={28} aria-hidden="true" /><p className="font-semibold">Map details are being prepared.</p><p className="max-w-md text-sm text-ink-muted">Please use the contact details above to arrange a conversation in Thane or Mumbai.</p><Link href="/contact" className="text-sm font-semibold text-brand-deep underline-offset-4 hover:underline">Contact the team</Link></div>}
          </div>
        </section>
      </Container>
    </>
  );
}
