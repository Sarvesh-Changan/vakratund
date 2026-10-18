import { ArrowRight, Calculator, Phone } from "lucide-react";
import Link from "next/link";
import type { HomeCta } from "@/server/queries/home";
import type { HomeEstimatorSection } from "@/server/queries/home";
import type { ResolvedSiteSettings } from "@/config/site";
import { ContactLink, TrackedWhatsAppLink } from "@/components/site/contact-link";
import { Container, GlowBlob, Reveal, WhatsAppIcon } from "@/components/ui";

export function HomeEstimatorTeaser({ section }: { section: HomeEstimatorSection | null }) {
  if (!section) return null;
  return <section className="section-light"><Container className="section-space"><Reveal className="grid gap-8 rounded-panel border border-line bg-tint p-7 shadow-soft sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="eyebrow">{section.eyebrow}</p><h2 className="mt-3 text-3xl font-bold">{section.title}</h2><p className="mt-4 max-w-2xl text-ink-muted">{section.description}</p></div><Link href="/estimate" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-accent px-5 font-bold text-accent-ink hover:-translate-y-0.5"><Calculator size={18} aria-hidden="true" /> {section.ctaLabel}</Link></Reveal></Container></section>;
}

export function HomeFinalCta({ cta, settings }: { cta: HomeCta | null; settings: ResolvedSiteSettings }) {
  if (!cta) return null;
  const phone = settings.phones[0];
  return <section className="section-gradient relative"><GlowBlob color="var(--glow-1)" className="-left-20 -top-24" /><GlowBlob color="var(--glow-3)" className="-bottom-24 -right-20" /><Container className="relative z-10 section-space"><Reveal className="mx-auto flex max-w-5xl flex-col items-center gap-7 text-center"><div className="max-w-3xl"><p className="eyebrow">{settings.tagline}</p><h2 className="mt-3 font-heading text-h2 font-semibold text-dark">{cta.title}</h2>{cta.description ? <p className="mt-4 text-lg leading-8 text-dark/75">{cta.description}</p> : null}</div><div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center"><a href={cta.primaryHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-accent px-5 font-bold text-accent-ink shadow-soft hover:-translate-y-0.5">{cta.primaryCta} <ArrowRight size={18} aria-hidden="true" /></a>{phone ? <ContactLink href={`tel:${phone}`} eventType="CALL" context="home-final-cta-call" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-dark/40 px-5 font-semibold text-dark hover:-translate-y-0.5"><Phone size={18} aria-hidden="true" />{cta.callCta || "Call Now"}</ContactLink> : null}<TrackedWhatsAppLink settings={settings} whatsappContext={{ pageTitle: "Home final CTA" }} context="home-final-cta-whatsapp" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-accent-2 px-5 font-bold text-accent-2-ink shadow-soft hover:-translate-y-0.5"><WhatsAppIcon size={18} />WhatsApp</TrackedWhatsAppLink></div></Reveal></Container></section>;
}
