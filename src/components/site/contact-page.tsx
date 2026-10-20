import { Clock3, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Reveal } from "@/components/motion";
import { Card, Container, SectionHeading } from "@/components/ui";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { formatBusinessHours } from "@/lib/site/business-hours";
import type { ResolvedSiteSettings } from "@/config/site";
import { ContactForm } from "./contact-form";
import { ContactCopyButton } from "./contact-copy-button";
import { ContactLink, TrackedWhatsAppLink } from "./contact-link";
import { phoneHref, whatsappHref } from "./contact-utils";

const breadcrumbs = [
  { name: "Home", item: "/" },
  { name: "Contact", item: "/contact" },
] as const;

export function ContactPage({
  settings,
  projectPrefill,
  projectSlug,
}: {
  settings: ResolvedSiteSettings;
  projectPrefill?: string;
  projectSlug?: string;
}) {
  const hours = formatBusinessHours(settings.businessHours);

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <section className="section-light relative overflow-hidden">
        <div className="home-blueprint-pattern absolute inset-0 opacity-[0.08]" aria-hidden="true" />
        <Container className="relative section-space-compact">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] lg:items-start lg:gap-16">
            <Reveal>
              <div className="max-w-md">
                <p className="eyebrow">Contact</p>
                <h1 className="mt-4 font-heading text-h1 font-semibold leading-[1.04] tracking-[-0.045em]">Let&apos;s discuss your space.</h1>
                <div className="mt-7 h-1 w-20 rounded-full bg-brand-deep" aria-hidden="true" />
                <ul className="mt-8 space-y-5" aria-label="Contact details">
                  {settings.phones.map((phone) => (
                    <li key={phone} className="flex items-center gap-4">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-surface shadow-soft">
                        <Phone className="text-brand-deep" size={21} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-ink-muted">Call us</p>
                        <div className="flex flex-wrap items-center gap-3">
                          <ContactLink href={phoneHref(phone)} eventType="CALL" context="contact-page-phone" className="font-semibold text-accent-ink underline-offset-4 hover:underline">{phone}</ContactLink>
                          <ContactCopyButton value={phone} label="phone number" />
                        </div>
                      </div>
                    </li>
                  ))}
                  {whatsappHref(settings, { pageTitle: "Contact page" }) ? (
                    <li className="flex items-center gap-4">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-whatsapp/40 bg-surface text-whatsapp shadow-soft">
                        <WhatsAppIcon size={22} />
                      </span>
                      <TrackedWhatsAppLink settings={settings} whatsappContext={{ pageTitle: "Contact page" }} context="contact-page-whatsapp" target="_blank" rel="noopener noreferrer" className="font-semibold text-whatsapp-text underline-offset-4 hover:underline">Message us on WhatsApp</TrackedWhatsAppLink>
                    </li>
                  ) : null}
                  {settings.email ? (
                    <li className="flex items-center gap-4">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-surface shadow-soft">
                        <Mail className="text-brand-deep" size={21} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-ink-muted">Email us</p>
                        <div className="flex flex-wrap items-center gap-3">
                          <a href={`mailto:${settings.email}`} className="break-all font-semibold text-accent-ink underline-offset-4 hover:underline">{settings.email}</a>
                          <ContactCopyButton value={settings.email} label="email address" />
                        </div>
                      </div>
                    </li>
                  ) : null}
                  <li className="flex items-center gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-surface shadow-soft">
                      <MapPin className="text-brand-deep" size={21} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm text-ink-muted">Find us</p>
                      <p className="font-semibold">{settings.address}</p>
                    </div>
                  </li>
                </ul>
                {hours.length ? (
                  <div className="mt-8 border-t border-line pt-6">
                    <div className="flex items-center gap-3">
                      <Clock3 className="text-brand-deep" size={20} aria-hidden="true" />
                      <h2 className="font-heading text-lg font-semibold">Business hours</h2>
                    </div>
                    <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                      {hours.map((entry) => <div key={entry.day} className="flex justify-between gap-4"><dt className="text-ink-muted">{entry.day}</dt><dd className="font-medium">{entry.value}</dd></div>)}
                    </dl>
                  </div>
                ) : null}
              </div>
            </Reveal>
            <Reveal delay={80}>
              <Card className="p-6 sm:p-8 lg:p-10">
                <h2 className="font-heading text-h2 font-semibold">Send us a message</h2>
                <div className="mt-7">
                  <ContactForm projectPrefill={projectPrefill} projectSlug={projectSlug} />
                </div>
              </Card>
            </Reveal>
          </div>

          <section className="mt-14" aria-label="Map and location">
            <SectionHeading eyebrow="Find us" title="Visit or plan a site discussion" />
            <div className="mt-6 overflow-hidden rounded-panel border bg-surface shadow-soft">
              {settings.mapEmbedUrl ? (
                <iframe
                  title={`${settings.businessName} location map`}
                  src={settings.mapEmbedUrl}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="h-[22rem] w-full border-0"
                />
              ) : (
                <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-6 text-center">
                  <MapPin className="text-brand-deep" size={28} aria-hidden="true" />
                  <p className="font-semibold">Map details are being prepared.</p>
                  <p className="max-w-md text-sm text-ink-muted">Please use the contact details above to arrange a conversation in Thane or Mumbai.</p>
                  <Link href="/contact" className="text-sm font-semibold text-brand-deep underline-offset-4 hover:underline">Contact the team</Link>
                </div>
              )}
            </div>
          </section>
          <div className="mt-8 rounded-card border border-line bg-tint p-5"><p className="eyebrow">What happens next</p><p className="mt-2 text-sm leading-6 text-ink-muted">{settings.responseTimeText}</p></div>
        </Container>
      </section>
    </>
  );
}
