import type { BusinessHours } from "@/lib/validation/settings";
import type { PublicSiteSettings } from "@/server/queries/settings";

export type ResolvedSiteSettings = {
  businessName: string;
  tagline: string;
  phones: string[];
  email: string;
  whatsappNumber: string;
  whatsappMessage: string;
  responseTimeText: string;
  address: string;
  mapEmbedUrl: string;
  businessHours: BusinessHours | null;
  socials: PublicSiteSettings["socials"];
  credentials: PublicSiteSettings["credentials"];
  foundedYear: number;
};

export const fallbackSiteSettings: ResolvedSiteSettings = {
  // TODO(client): replace the text wordmark with the approved logo asset.
  businessName: "M/s. Vakratund Construction",
  tagline: "Quality is our first priority",
  phones: ["+919821502956", "+919359895322"],
  email: "",
  // TODO(client): confirm the WhatsApp Business number before launch.
  whatsappNumber: "+919821502956",
  whatsappMessage: "Hello Vakratund Construction, I would like to discuss a project.",
  responseTimeText: "Share your requirement and we will review the next useful step.",
  address: "Thane and Mumbai, Maharashtra",
  mapEmbedUrl: "",
  businessHours: null,
  socials: [],
  credentials: [
    { label: "Registered", value: "MSME, Government of India" },
    { label: "Insured", value: "Workmen's compensation insurance" },
  ],
  foundedYear: 2003,
};

export function resolveSiteSettings(settings: PublicSiteSettings | null): ResolvedSiteSettings {
  return {
    businessName: settings?.businessName || fallbackSiteSettings.businessName,
    tagline: settings?.tagline || fallbackSiteSettings.tagline,
    phones: settings?.phones.length ? settings.phones : fallbackSiteSettings.phones,
    email: settings?.email || fallbackSiteSettings.email,
    whatsappNumber: settings?.whatsappNumber || settings?.phones[0] || fallbackSiteSettings.whatsappNumber,
    whatsappMessage: settings?.whatsappMessage || fallbackSiteSettings.whatsappMessage,
    responseTimeText: settings?.responseTimeText || fallbackSiteSettings.responseTimeText,
    address: settings?.address || fallbackSiteSettings.address,
    mapEmbedUrl: settings?.mapEmbedUrl || fallbackSiteSettings.mapEmbedUrl,
    businessHours: settings?.businessHours ?? fallbackSiteSettings.businessHours,
    socials: settings?.socials.length ? settings.socials : fallbackSiteSettings.socials,
    credentials: settings?.credentials.length ? settings.credentials : fallbackSiteSettings.credentials,
    foundedYear: settings?.foundedYear || fallbackSiteSettings.foundedYear,
  };
}

export const siteNavigation = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Projects", href: "/projects" },
  { label: "Insights", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

export const footerServiceLinks = [
  { label: "Building Construction", href: "/services/building-construction" },
  { label: "Structural Repairs", href: "/services/structural-repairs-rehabilitation" },
  { label: "Waterproofing Solutions", href: "/services/waterproofing-solutions" },
  { label: "Redevelopment PMC", href: "/services/redevelopment-project-management" },
] as const;

export const footerQuickLinks = [
  { label: "About us", href: "/about" },
  { label: "Our projects", href: "/projects" },
  { label: "Estimate a project", href: "/estimate" },
  { label: "Download company profile", href: "/download/company-profile" },
  { label: "Request inspection", href: "/contact?type=inspection" },
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms of use", href: "/terms" },
] as const;
