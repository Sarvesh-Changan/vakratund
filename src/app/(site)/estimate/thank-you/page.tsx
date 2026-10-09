import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { AnalyticsConversion } from "@/components/site/analytics-conversion";
import { ContactLink, TrackedWhatsAppLink } from "@/components/site/contact-link";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { resolveSiteSettings } from "@/config/site";
import { Container, Card, SectionHeading } from "@/components/ui";
import { buildMetadata } from "@/lib/seo/metadata";
import { phoneHref } from "@/components/site/contact-utils";
import { publicReferenceSchema } from "@/lib/validation/quote-submission";
import { getPublicSettings } from "@/server/queries/settings";
import { getPublicQuoteByReference } from "@/server/queries/quotes";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/estimate/thank-you", fallbackTitle: "Estimate Enquiry Received", fallbackDescription: "Your Vakratund Construction estimate enquiry has been received.", noIndex: true });
}

export default async function EstimateThankYouPage({ searchParams }: { searchParams: Promise<{ ref?: string | string[] }> }) {
  const params = await searchParams;
  const reference = Array.isArray(params.ref) ? params.ref[0] : params.ref;
  if (!reference || !publicReferenceSchema(reference)) notFound();
  const [quote, settings] = await Promise.all([getPublicQuoteByReference(reference), getPublicSettings().catch(() => null)]);
  if (!quote) notFound();
  const resolved = resolveSiteSettings(settings);
  const isInspection = quote.pricingMode === "INSPECTION_ONLY";
  const breadcrumbs = [{ name: "Home", item: "/" }, { name: "Estimate", item: "/estimate" }, { name: "Enquiry received", item: "/estimate/thank-you" }] as const;

  return (
    <Container className="py-16 sm:py-24">
      <BreadcrumbJsonLd items={breadcrumbs} />
      <AnalyticsConversion events={["generate_lead", "estimate_completed"]} reference={quote.publicId} />
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs items={breadcrumbs.map((item) => ({ label: item.name, href: item.item }))} />
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-deep">Enquiry received</p>
        <h1 className="mt-4 font-heading text-4xl font-bold sm:text-5xl">Thank you for getting in touch.</h1>
        <p className="mt-5 text-lg leading-8 text-ink-muted">Your reference is <strong className="text-ink">{quote.publicId}</strong>. Please keep it handy when speaking with our team.</p>
        <Card className="mt-10">
          <SectionHeading eyebrow={quote.serviceName} title={isInspection ? "Site inspection requested" : "Your indicative estimate"} />
          {isInspection ? <p className="mt-4 text-ink-muted">A final quotation will follow after the site inspection.</p> : <><p className="mt-4 font-heading text-3xl font-bold">₹{quote.lowAmount.toLocaleString("en-IN")} – ₹{quote.highAmount.toLocaleString("en-IN")}</p>{quote.breakdown.length > 0 ? <ul className="mt-6 space-y-2 border-t border-line pt-5 text-sm">{quote.breakdown.map((item) => <li key={item.id} className="flex justify-between gap-4"><span>{item.label}</span><span className="font-semibold">{item.amount === 0 ? "Included" : `₹${item.amount.toLocaleString("en-IN")}`}</span></li>)}</ul> : null}</>}
          <p className="mt-6 border-t border-line pt-5 text-sm leading-6 text-ink-muted">Indicative estimate. Final quotation after site inspection.</p>
        </Card>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <ContactLink href={phoneHref(resolved.phones[0] ?? "")} eventType="CALL" context="estimate-thank-you-call" className="inline-flex min-h-12 items-center justify-center rounded-control border bg-surface px-5 font-semibold hover:bg-surface-alt">Call us</ContactLink>
          <TrackedWhatsAppLink settings={resolved} whatsappContext={{ pageTitle: "Estimate thank-you", estimateReference: quote.publicId }} context="estimate-thank-you-whatsapp" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-control bg-[#25D366] px-5 font-semibold text-white hover:brightness-95">WhatsApp us</TrackedWhatsAppLink>
          <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-control bg-brand px-5 font-bold text-brand-ink hover:bg-brand/90">Back to home</Link>
        </div>
        <div className="mt-12"><h2 className="font-heading text-2xl font-bold">What happens next?</h2><ol className="mt-5 grid gap-3 sm:grid-cols-3"><li className="rounded-control border bg-surface p-4 text-sm text-ink-muted"><strong className="block text-ink">1. Review</strong>Our team reviews the details you shared.</li><li className="rounded-control border bg-surface p-4 text-sm text-ink-muted"><strong className="block text-ink">2. Discuss</strong>We clarify scope and project requirements.</li><li className="rounded-control border bg-surface p-4 text-sm text-ink-muted"><strong className="block text-ink">3. Inspect</strong>Final quotation follows a site inspection.</li></ol></div>
      </div>
    </Container>
  );
}
