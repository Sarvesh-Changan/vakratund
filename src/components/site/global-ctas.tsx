import { ArrowUpRight, Phone } from "lucide-react";
import type { ResolvedSiteSettings } from "@/config/site";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { ContactLink, TrackedWhatsAppLink } from "./contact-link";
import { phoneHref } from "./contact-utils";

export function GlobalCtas({ settings }: { settings: ResolvedSiteSettings }) {
  const phone = settings.phones[0];

  if (!phone) return null;

  return (
    <>
      <div role="complementary" aria-label="WhatsApp contact" className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 md:bottom-6">
        <div className="relative">
          <TrackedWhatsAppLink settings={settings} whatsappContext={{ pageTitle: "Floating WhatsApp" }} context="floating-whatsapp" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" className="whatsapp-float flex size-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-raised ring-4 ring-white transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4"><WhatsAppIcon size={28} /></TrackedWhatsAppLink>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] shadow-raised backdrop-blur md:hidden" aria-label="Contact actions">
        <div className="grid h-16 grid-cols-3">
          <ContactLink href={phoneHref(phone)} eventType="CALL" context="mobile-bar" className="flex flex-col items-center justify-center gap-1 border-r border-line text-xs font-semibold text-ink hover:bg-tint"><Phone size={19} className="text-accent-ink" aria-hidden="true" />Call</ContactLink>
          <TrackedWhatsAppLink settings={settings} whatsappContext={{ pageTitle: "Mobile contact bar" }} context="mobile-bar" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-1 border-r border-line text-xs font-semibold text-ink hover:bg-tint"><WhatsAppIcon size={19} className="text-whatsapp-text" />WhatsApp</TrackedWhatsAppLink>
          <a href="/estimate" className="flex flex-col items-center justify-center gap-1 bg-accent text-xs font-bold text-accent-ink hover:bg-accent/90"><ArrowUpRight size={19} aria-hidden="true" />Get Quote</a>
        </div>
      </nav>
    </>
  );
}
