import { ExternalLink, Globe2, Mail, MapPin, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { footerQuickLinks, footerServiceLinks, type ResolvedSiteSettings } from "@/config/site";
import { ContactLink, TrackedWhatsAppLink } from "./contact-link";
import { phoneHref } from "./contact-utils";

const socialIcons: Record<string, LucideIcon> = { facebook: Globe2, instagram: Globe2, linkedin: Globe2 };

function socialIcon(label: string): LucideIcon | null {
  return socialIcons[label.toLowerCase()] ?? null;
}

export function SiteFooter({ settings }: { settings: ResolvedSiteSettings }) {
  return (
    <footer className="bg-charcoal text-white">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr] lg:px-8 lg:py-20">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 font-heading text-lg font-bold"><span className="flex size-9 items-center justify-center rounded-full bg-brand text-sm text-brand-ink" aria-hidden="true">V</span>{settings.businessName}</Link>
          <p className="mt-5 max-w-sm text-sm leading-7 text-white/65">{settings.tagline}. Civil engineering, PMC and turnkey project development for societies, businesses and property owners across Thane and Mumbai.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {settings.credentials.map((credential) => <span key={`${credential.label}-${credential.value}`} className="rounded-pill border border-white/15 px-3 py-1 text-xs text-white/70">{credential.label}</span>)}
          </div>
        </div>

        <div><h2 className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-brand">Services</h2><ul className="mt-5 space-y-3">{footerServiceLinks.map((link) => <li key={link.href}><Link href={link.href} className="text-sm text-white/70 transition-colors hover:text-white">{link.label}</Link></li>)}</ul></div>
        <div><h2 className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-brand">Explore</h2><ul className="mt-5 space-y-3">{footerQuickLinks.map((link) => <li key={link.href}><Link href={link.href} className="text-sm text-white/70 transition-colors hover:text-white">{link.label}</Link></li>)}</ul></div>

        <div>
          <h2 className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-brand">Contact</h2>
          <ul className="mt-5 space-y-4 text-sm text-white/70">
            <li className="flex gap-3"><MapPin className="mt-1 shrink-0 text-brand" size={17} aria-hidden="true" /><span>{settings.address}</span></li>
            {settings.phones.map((phone) => <li key={phone}><ContactLink href={phoneHref(phone)} eventType="CALL" context="footer-phone" className="inline-flex items-center gap-3 hover:text-white"><Phone className="shrink-0 text-brand" size={17} aria-hidden="true" />{phone}</ContactLink></li>)}
            {settings.email ? <li><a href={`mailto:${settings.email}`} className="inline-flex items-center gap-3 hover:text-white"><Mail className="shrink-0 text-brand" size={17} aria-hidden="true" />{settings.email}</a></li> : null}
          </ul>
          <TrackedWhatsAppLink settings={settings} context="footer-whatsapp" target="_blank" rel="noreferrer" className="mt-6 inline-flex min-h-11 items-center rounded-control border border-white/20 px-4 text-sm font-semibold text-white hover:border-brand hover:text-brand">Message on WhatsApp</TrackedWhatsAppLink>
          {settings.socials.length ? <div className="mt-7 flex gap-2" aria-label="Social links">{settings.socials.map((social) => { const Icon = socialIcon(social.label); return <a key={social.url} href={social.url} target="_blank" rel="noreferrer" aria-label={social.label} className="inline-flex size-10 items-center justify-center rounded-full border border-white/15 text-white/70 hover:border-brand hover:text-brand">{Icon ? <Icon size={17} aria-hidden="true" /> : <ExternalLink size={17} aria-hidden="true" />}</a>; })}</div> : null}
        </div>
      </div>
      <div className="border-t border-white/10"><div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-4 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><p>© {new Date().getFullYear()} {settings.businessName}. All rights reserved.</p><p>Since {settings.foundedYear} · Thane &amp; Mumbai, Maharashtra</p></div></div>
    </footer>
  );
}
