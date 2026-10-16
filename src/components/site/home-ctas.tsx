import { ArrowRight, Calculator, Phone } from "lucide-react";
import Link from "next/link";
import type { HomeCta } from "@/server/queries/home";
import type { HomeEstimatorSection } from "@/server/queries/home";
import type { ResolvedSiteSettings } from "@/config/site";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { ContactLink, TrackedWhatsAppLink } from "@/components/site/contact-link";
import { Container, Reveal } from "@/components/ui";

export function HomeEstimatorTeaser({ section }: { section: HomeEstimatorSection | null }) {
  if (!section) return null;
  return <section className="bg-charcoal text-white"><Container className="section-space"><Reveal className="grid gap-8 rounded-panel border border-white/10 bg-white/5 p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="eyebrow text-brand">{section.eyebrow}</p><h2 className="mt-3 text-3xl font-bold">{section.title}</h2><p className="mt-4 max-w-2xl text-white/65">{section.description}</p></div><Link href="/estimate" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-brand px-5 font-bold text-brand-ink hover:bg-brand/90"><Calculator size={18} aria-hidden="true" /> {section.ctaLabel}</Link></Reveal></Container></section>;
}

export function HomeFinalCta({ cta, settings }: { cta: HomeCta | null; settings: ResolvedSiteSettings }) {
  if (!cta) return null;
  const phone = settings.phones[0];
  return <section className="bg-brand"><Container className="section-space"><Reveal className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between"><div className="max-w-2xl"><h2 className="text-3xl font-bold text-brand-ink sm:text-4xl">{cta.title}</h2>{cta.description ? <p className="mt-4 text-lg leading-8 text-brand-ink/75">{cta.description}</p> : null}</div><div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"><a href={cta.primaryHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-brand-ink px-5 font-bold text-brand hover:bg-brand-ink/90">{cta.primaryCta} <ArrowRight size={18} aria-hidden="true" /></a>{phone ? <ContactLink href={`tel:${phone}`} eventType="CALL" context="home-final-cta-call" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-brand-ink/30 px-5 font-semibold text-brand-ink hover:bg-brand-ink/10"><Phone size={18} aria-hidden="true" />{cta.callCta || "Call Now"}</ContactLink> : null}<TrackedWhatsAppLink settings={settings} whatsappContext={{ pageTitle: "Home final CTA" }} context="home-final-cta-whatsapp" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-whatsapp px-5 font-semibold text-charcoal hover:bg-whatsapp-dark"><WhatsAppIcon size={18} />{cta.whatsappCta || "Chat on WhatsApp"}</TrackedWhatsAppLink></div></Reveal></Container></section>;
}
