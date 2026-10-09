import { ArrowUpRight, MessageCircle, Phone } from "lucide-react";
import type { ResolvedSiteSettings } from "@/config/site";
import { ContactLink, TrackedWhatsAppLink } from "./contact-link";
import { phoneHref } from "./contact-utils";

export function GlobalCtas({ settings }: { settings: ResolvedSiteSettings }) {
  const phone = settings.phones[0];

  if (!phone) return null;

  return (
    <>
      <div className="fixed bottom-24 right-4 z-40 md:bottom-6">
        <div className="relative">
          <TrackedWhatsAppLink settings={settings} whatsappContext={{ pageTitle: "Floating WhatsApp" }} context="floating-whatsapp" target="_blank" rel="noreferrer" aria-label="Chat with Vakratund Construction on WhatsApp" className="flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-raised transition-transform hover:scale-105"><MessageCircle size={26} fill="currentColor" aria-hidden="true" /></TrackedWhatsAppLink>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-raised backdrop-blur md:hidden" aria-label="Contact actions">
        <div className="grid h-16 grid-cols-3">
          <ContactLink href={phoneHref(phone)} eventType="CALL" context="mobile-bar" className="flex flex-col items-center justify-center gap-1 border-r border-line text-xs font-semibold text-ink hover:bg-surface-alt"><Phone size={19} className="text-brand-deep" aria-hidden="true" />Call</ContactLink>
          <TrackedWhatsAppLink settings={settings} whatsappContext={{ pageTitle: "Mobile contact bar" }} context="mobile-bar" target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center gap-1 border-r border-line text-xs font-semibold text-ink hover:bg-surface-alt"><MessageCircle size={19} className="text-[#159447]" aria-hidden="true" />WhatsApp</TrackedWhatsAppLink>
          <a href="/estimate" className="flex flex-col items-center justify-center gap-1 bg-brand text-xs font-bold text-brand-ink hover:bg-brand/90"><ArrowUpRight size={19} aria-hidden="true" />Get Quote</a>
        </div>
      </div>
    </>
  );
}
