/**
 * Local landing pages are regular Service records so the existing service
 * editor, public detail page, metadata and sitemap stay the single source of
 * truth. Their slugs are omitted from the general services index.
 */
export const localLandingSlugs = [
  "structural-audit-thane",
  "terrace-waterproofing-thane",
  "society-redevelopment-pmc-thane",
] as const;

export function isLocalLandingSlug(slug: string): boolean {
  return (localLandingSlugs as readonly string[]).includes(slug);
}
