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
  return buildMetadata({ path: "/project-enquiry/thank-you", fallbackTitle: "Project Enquiry Received", fallbackDescription: "Your project enquiry has been received.", noIndex: true });
}

export default async function ProjectEnquiryThankYou({ searchParams }: { searchParams: Promise<{ ref?: string | string[] }> }) {
  const params = await searchParams;
  const reference = Array.isArray(params.ref) ? params.ref[0] : params.ref;
  if (!reference || !publicReferenceSchema(reference)) notFound();
  const [lead, settings] = await Promise.all([getPublicLeadByReference(reference, "PROJECT_ENQUIRY"), getPublicSettings().catch(() => null)]);
  if (!lead) notFound();
  return <LeadThankYou settings={resolveSiteSettings(settings)} eyebrow="Project enquiry received" title="Thank you for sharing the project." description="Your project enquiry has been saved. Our team will review the published project details and follow up with the right next step." breadcrumbs={[{ name: "Home", item: "/" }, { name: "Project enquiry", item: "/project-enquiry/thank-you" }]} />;
}
