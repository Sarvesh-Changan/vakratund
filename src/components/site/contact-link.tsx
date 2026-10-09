import type { AnchorHTMLAttributes } from "react";
import type { ResolvedSiteSettings } from "@/config/site";
import { whatsappHref, type WhatsAppContext } from "./contact-utils";

type ContactLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  eventType?: "CALL" | "WHATSAPP";
  context: string;
};

export function ContactLink({ eventType, context, ...props }: ContactLinkProps) {
  return <a {...props} data-contact-type={eventType} data-contact-context={context} />;
}

type TrackedWhatsAppLinkProps = Omit<ContactLinkProps, "eventType"> & { settings: ResolvedSiteSettings; whatsappContext?: WhatsAppContext };

export function TrackedWhatsAppLink({ settings, whatsappContext, ...props }: TrackedWhatsAppLinkProps) {
  const href = whatsappHref(settings, whatsappContext);
  if (!href) return null;
  return <ContactLink {...props} href={href} eventType="WHATSAPP" />;
}
