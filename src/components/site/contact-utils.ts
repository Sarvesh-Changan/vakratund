import type { ResolvedSiteSettings } from "@/config/site";
import { buildWhatsAppHref, type WhatsAppContext } from "@/lib/contact/whatsapp";

export { buildWhatsAppHref } from "@/lib/contact/whatsapp";
export type { WhatsAppContext } from "@/lib/contact/whatsapp";

export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

export function whatsappHref(settings: ResolvedSiteSettings, context: WhatsAppContext | string = {}): string | null {
  const normalizedContext: WhatsAppContext = typeof context === "string" ? { pageTitle: context } : context;
  return buildWhatsAppHref(settings, normalizedContext);
}
