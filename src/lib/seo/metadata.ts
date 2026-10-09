import type { Metadata } from "next";
import { env } from "@/lib/env";

export type EntitySeoFields = {
  seoTitle?: string | null;
  seoDesc?: string | null;
};

export type PageSeoFields = EntitySeoFields & {
  title?: string | null;
  description?: string | null;
  canonical?: string | null;
  noIndex?: boolean;
  ogImage?: { url: string; alt: string } | null;
};

export type BuildMetadataOptions = {
  path: string;
  fallbackTitle: string;
  fallbackDescription: string;
  pageSeo?: PageSeoFields | null;
  entitySeo?: EntitySeoFields | null;
  siteName?: string;
  ogImage?: { url: string; alt: string } | null;
  noIndex?: boolean;
  siteUrl?: string;
};

export const DEFAULT_OG_IMAGE_PATH = "/og-default.svg";

export function getSiteUrl(siteUrl = env.NEXT_PUBLIC_SITE_URL): string {
  return siteUrl.replace(/\/$/, "");
}

export function absoluteUrl(value: string, siteUrl = getSiteUrl()): string {
  if (/^https:\/\//i.test(value) || /^http:\/\//i.test(value)) return value;
  return `${siteUrl}/${value.replace(/^\//, "")}`;
}

function canonicalUrl(path: string, configuredCanonical: string | null | undefined, siteUrl: string): string {
  return absoluteUrl(configuredCanonical || path, siteUrl);
}

export function buildMetadata(options: BuildMetadataOptions): Metadata {
  const siteUrl = getSiteUrl(options.siteUrl);
  const pageSeo = options.pageSeo;
  const entitySeo = options.entitySeo;
  const title = pageSeo?.title || pageSeo?.seoTitle || entitySeo?.seoTitle || options.fallbackTitle;
  const description = pageSeo?.description || pageSeo?.seoDesc || entitySeo?.seoDesc || options.fallbackDescription;
  const image = pageSeo?.ogImage || options.ogImage || { url: DEFAULT_OG_IMAGE_PATH, alt: "Vakratund Construction" };
  const noIndex = Boolean(options.noIndex || pageSeo?.noIndex);
  const canonical = canonicalUrl(options.path, pageSeo?.canonical, siteUrl);
  const imageUrl = absoluteUrl(image.url, siteUrl);

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: { canonical },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: options.siteName || "Vakratund Construction",
      title,
      description,
      images: [{ url: imageUrl, alt: image.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
