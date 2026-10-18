import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveSiteSettings } from "@/config/site";
import { LeadThankYou } from "@/components/site/lead-thank-you";
import { buildMetadata } from "@/lib/seo/metadata";
import { publicReferenceSchema } from "@/lib/validation/quote-submission";
import { getPublicSettings } from "@/server/queries/settings";
import { getPublicLeadByReference } from "@/server/queries/public-leads";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/contact/thank-you", fallbackTitle: "Enquiry Received", fallbackDescription: "Your contact enquiry has been received.", noIndex: true });
}

export default async function ContactThankYou({ searchParams }: { searchParams: Promise<{ ref?: string | string[] }> }) {
  const params = await searchParams;
  const reference = Array.isArray(params.ref) ? params.ref[0] : params.ref;
  if (!reference || !publicReferenceSchema(reference)) notFound();
  const [lead, settings] = await Promise.all([getPublicLeadByReference(reference, "CONTACT"), getPublicSettings().catch(() => null)]);
  if (!lead) notFound();
  return <LeadThankYou reference={lead.publicId} settings={resolveSiteSettings(settings)} eyebrow="Enquiry received" title="Thank you for getting in touch." description="Your enquiry has been saved. Our team will review it and follow up about the next useful step." breadcrumbs={[{ name: "Home", item: "/" }, { name: "Contact", item: "/contact" }, { name: "Enquiry received", item: "/contact/thank-you" }]} />;
}
