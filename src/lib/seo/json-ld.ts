import type { ResolvedSiteSettings } from "@/config/site";
import { absoluteUrl, getSiteUrl } from "./metadata";
import type { BusinessHours } from "@/lib/validation/settings";

export type JsonLdValue = string | number | boolean | null | JsonLdValue[] | { [key: string]: JsonLdValue };
export type BreadcrumbItem = { name: string; item: string };
export type ServiceJsonLdInput = {
  name: string;
  description: string;
  slug: string;
  image?: string | null;
  providerName: string;
};
export type FaqJsonLdItem = { question: string; answer: string };
export type ImageGalleryJsonLdInput = { name: string; description: string; url: string; images: readonly string[] };
export type CreativeWorkJsonLdInput = {
  name: string;
  description: string;
  slug: string;
  image?: string | null;
  location?: string | null;
  serviceName?: string | null;
  clientName?: string | null;
  year?: number | null;
  creatorName: string;
};

const businessHourDays: Array<[keyof BusinessHours, string]> = [
  ["monday", "Monday"],
  ["tuesday", "Tuesday"],
  ["wednesday", "Wednesday"],
  ["thursday", "Thursday"],
  ["friday", "Friday"],
  ["saturday", "Saturday"],
  ["sunday", "Sunday"],
];

function openingHours(hours: BusinessHours | null): string[] {
  if (!hours) return [];
  return businessHourDays.flatMap(([day, label]) => {
    const entry = hours[day];
    return entry.closed ? [] : [`${label} ${entry.open}-${entry.close}`];
  });
}

export function serializeJsonLd(value: JsonLdValue): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export function buildGeneralContractorJsonLd(settings: ResolvedSiteSettings, siteUrl = getSiteUrl()): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "GeneralContractor"],
    "@id": `${siteUrl}/#business`,
    name: settings.businessName,
    description: `${settings.businessName} provides civil engineering, PMC, turnkey development, structural repair and rehabilitation services across Thane and Mumbai.`,
    url: siteUrl,
    telephone: settings.phones,
    foundingDate: String(settings.foundedYear),
    openingHours: openingHours(settings.businessHours),
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address,
      addressLocality: "Thane",
      addressRegion: "Maharashtra",
      addressCountry: "IN",
    },
    areaServed: [
      { "@type": "City", name: "Thane" },
      { "@type": "City", name: "Mumbai" },
    ],
    sameAs: settings.socials.map((social) => social.url),
  };
}

export function buildBreadcrumbListJsonLd(items: readonly BreadcrumbItem[], siteUrl = getSiteUrl()): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.item, siteUrl),
    })),
  };
}

export function buildServiceJsonLd(service: ServiceJsonLdInput, siteUrl = getSiteUrl()): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${absoluteUrl(`/services/${service.slug}`, siteUrl)}#service`,
    name: service.name,
    description: service.description,
    url: absoluteUrl(`/services/${service.slug}`, siteUrl),
    ...(service.image ? { image: absoluteUrl(service.image, siteUrl) } : {}),
    provider: {
      "@type": ["LocalBusiness", "GeneralContractor"],
      "@id": `${siteUrl}/#business`,
      name: service.providerName,
    },
    areaServed: [
      { "@type": "City", name: "Thane" },
      { "@type": "City", name: "Mumbai" },
    ],
  };
}

export function buildFaqPageJsonLd(faqs: readonly FaqJsonLdItem[]): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export function buildImageGalleryJsonLd(gallery: ImageGalleryJsonLdInput): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: gallery.name,
    description: gallery.description,
    url: absoluteUrl(gallery.url),
    image: gallery.images.map((image) => absoluteUrl(image)),
  };
}

export function buildCreativeWorkJsonLd(project: CreativeWorkJsonLdInput, siteUrl = getSiteUrl()): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${absoluteUrl(`/projects/${project.slug}`, siteUrl)}#project`,
    name: project.name,
    description: project.description,
    url: absoluteUrl(`/projects/${project.slug}`, siteUrl),
    creator: { "@type": "Organization", name: project.creatorName },
    ...(project.image ? { image: absoluteUrl(project.image, siteUrl) } : {}),
    ...(project.location ? { locationCreated: { "@type": "Place", name: project.location } } : {}),
    ...(project.serviceName ? { about: { "@type": "Service", name: project.serviceName } } : {}),
    ...(project.clientName ? { contributor: { "@type": "Organization", name: project.clientName } } : {}),
    ...(project.year ? { dateCreated: `${project.year}-01-01` } : {}),
  };
}
