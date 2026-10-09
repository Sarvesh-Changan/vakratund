import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveSiteSettings } from "@/config/site";
import { LeadThankYou } from "@/components/site/lead-thank-you";
import { buildMetadata } from "@/lib/seo/metadata";
import { publicReferenceSchema } from "@/lib/validation/quote-submission";
import { createBrochureToken } from "@/server/brochure-token";
import { getPublicBrochureMedia } from "@/server/queries/brochure";
import { getPublicLeadByReference } from "@/server/queries/public-leads";
import { getPublicSettings } from "@/server/queries/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/download/company-profile/thank-you", fallbackTitle: "Company Profile Ready", fallbackDescription: "Your company profile download is ready.", noIndex: true });
}

export default async function BrochureThankYou({ searchParams }: { searchParams: Promise<{ ref?: string | string[] }> }) {
  const params = await searchParams;
  const reference = Array.isArray(params.ref) ? params.ref[0] : params.ref;
  if (!reference || !publicReferenceSchema(reference)) notFound();
  const [lead, settings, brochure] = await Promise.all([getPublicLeadByReference(reference, "BROCHURE"), getPublicSettings().catch(() => null), getPublicBrochureMedia()]);
  if (!lead || !brochure) notFound();
  const token = createBrochureToken(brochure.id);
  return <LeadThankYou settings={resolveSiteSettings(settings)} eyebrow="Brochure request received" title="Your company profile is ready." description="Thank you. Use the short-lived link below to download the configured company profile PDF." downloadHref={`/api/brochure/download?token=${encodeURIComponent(token)}`} breadcrumbs={[{ name: "Home", item: "/" }, { name: "Company profile", item: "/download/company-profile" }, { name: "Download ready", item: "/download/company-profile/thank-you" }]} />;
}
