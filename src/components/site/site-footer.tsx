import { ArrowUpRight, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import type { ResolvedSiteSettings } from "@/config/site";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { ContactLink, TrackedWhatsAppLink } from "./contact-link";
import { phoneHref } from "./contact-utils";
import type { HeaderService } from "./site-header";

export function SiteFooter({ settings, services }: { settings: ResolvedSiteSettings; services: HeaderService[] }) {
  const phone = settings.phones[0];
  return (
    <>
      <section aria-labelledby="footer-cta-heading" className="bg-brand text-brand-ink">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-7 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between md:px-8 md:py-16">
          <div className="max-w-3xl"><p className="eyebrow footer-cta-eyebrow">Let’s build with confidence</p><h2 id="footer-cta-heading" className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">Ready to start your project?</h2><p className="mt-3 max-w-2xl text-base leading-7 text-brand-ink/75">Tell us what you’re planning. Our team can help you take the next step.</p></div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/estimate" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-brand-ink px-5 font-bold text-white transition-colors hover:bg-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep">Get Free Quote <ArrowUpRight size={18} aria-hidden="true" /></Link>
            {phone ? <ContactLink href={phoneHref(phone)} eventType="CALL" context="footer-cta-call" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-brand-ink/30 px-5 font-semibold text-brand-ink hover:bg-brand-ink/10"><Phone size={17} aria-hidden="true" />Call</ContactLink> : null}
            <TrackedWhatsAppLink settings={settings} whatsappContext={{ pageTitle: "Footer project CTA" }} context="footer-cta-whatsapp" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-brand-ink/30 px-5 font-semibold text-brand-ink hover:bg-brand-ink/10"><WhatsAppIcon size={18} />WhatsApp</TrackedWhatsAppLink>
          </div>
        </div>
      </section>

      <footer className="bg-charcoal text-white">
        <div className="mx-auto grid max-w-[1440px] gap-x-8 gap-y-12 px-4 py-14 sm:px-6 sm:grid-cols-2 md:grid-cols-3 lg:px-8 xl:grid-cols-[1.4fr_1.55fr_.8fr_1.2fr_1.15fr_1fr] xl:gap-x-6 xl:py-16">
          <section aria-labelledby="footer-about-heading">
            <h2 id="footer-about-heading" className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-brand">About</h2>
            <Link href="/" className="mt-4 inline-flex items-center gap-2 font-heading text-lg font-bold"><span className="flex size-9 items-center justify-center rounded-full bg-brand text-sm text-brand-ink" aria-hidden="true">V</span>{settings.businessName}</Link>
            <p className="mt-4 max-w-sm text-sm leading-7 text-white/65">{settings.tagline}. Civil engineering, project management and turnkey construction across Thane and Mumbai.</p>
          </section>

          <nav aria-labelledby="footer-services-heading"><h2 id="footer-services-heading" className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-brand">Services</h2><ul className="mt-5 space-y-3">{services.map((service) => <li key={service.slug}><Link href={`/services/${service.slug}`} className="text-sm leading-6 text-white/70 transition-colors hover:text-white">{service.title}</Link></li>)}</ul></nav>

          <nav aria-labelledby="footer-company-heading"><h2 id="footer-company-heading" className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-brand">Company</h2><ul className="mt-5 space-y-3"><li><Link href="/about" className="text-sm text-white/70 hover:text-white">About us</Link></li><li><Link href="/projects" className="text-sm text-white/70 hover:text-white">Projects</Link></li><li><Link href="/gallery" className="text-sm text-white/70 hover:text-white">Gallery</Link></li><li><Link href="/blog" className="text-sm text-white/70 hover:text-white">Insights</Link></li><li><Link href="/download/company-profile" className="text-sm text-white/70 hover:text-white">Company profile</Link></li></ul></nav>

          <section aria-labelledby="footer-contact-heading"><h2 id="footer-contact-heading" className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-brand">Contact</h2><ul className="mt-5 space-y-4 text-sm text-white/70"><li className="flex gap-3"><MapPin className="mt-1 shrink-0 text-brand" size={17} aria-hidden="true" /><span>{settings.address}</span></li>{settings.phones.map((value) => <li key={value}><ContactLink href={phoneHref(value)} eventType="CALL" context="footer-phone" className="inline-flex items-center gap-3 hover:text-white"><Phone className="shrink-0 text-brand" size={17} aria-hidden="true" />{value}</ContactLink></li>)}{settings.email ? <li><a href={`mailto:${settings.email}`} className="inline-flex items-center gap-3 break-all hover:text-white"><Mail className="shrink-0 text-brand" size={17} aria-hidden="true" />{settings.email}</a></li> : null}</ul><Link href="/contact" className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-brand hover:underline">Contact our team <ArrowUpRight className="ml-1" size={15} aria-hidden="true" /></Link></section>

          <section aria-labelledby="footer-credentials-heading"><h2 id="footer-credentials-heading" className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-brand">Credentials</h2><ul className="mt-5 space-y-4">{settings.credentials.map((credential) => <li key={`${credential.label}-${credential.value}`}><p className="text-sm font-semibold text-white">{credential.label}</p><p className="mt-1 text-xs leading-5 text-white/60">{credential.value}</p></li>)}</ul><p className="mt-5 text-xs text-white/55">Established {settings.foundedYear}</p></section>

          <section aria-labelledby="footer-connect-heading"><h2 id="footer-connect-heading" className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-brand">Connect</h2>{settings.socials.length ? <ul className="mt-5 flex flex-wrap gap-2">{settings.socials.map((social) => <li key={social.url}><a href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.label} className="inline-flex size-11 items-center justify-center rounded-full border border-white/15 text-white/75 transition-colors hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"><ExternalLink size={18} aria-hidden="true" /></a></li>)}</ul> : <p className="mt-5 text-sm text-white/60">Follow our project updates and company news.</p>}<TrackedWhatsAppLink settings={settings} whatsappContext={{ pageTitle: "Footer contact" }} context="footer-whatsapp" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-control border border-white/20 px-3 text-sm font-semibold text-white hover:border-brand hover:text-brand"><WhatsAppIcon size={17} />Chat on WhatsApp</TrackedWhatsAppLink></section>
        </div>

        <div className="border-t border-white/10"><div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-5 text-xs text-white/55 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8"><p>© {new Date().getFullYear()} {settings.businessName}. All rights reserved.</p><nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2"><Link href="/privacy" className="hover:text-white">Privacy policy</Link><Link href="/terms" className="hover:text-white">Terms of use</Link></nav><p>Thane &amp; Mumbai, Maharashtra</p></div></div>
      </footer>
    </>
  );
}
