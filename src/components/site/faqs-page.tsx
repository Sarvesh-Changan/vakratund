import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { BreadcrumbJsonLd, FaqPageJsonLd } from "@/components/seo/json-ld";
import { Container, EmptyState } from "@/components/ui";
import type { PublishedFaq } from "@/server/queries/faqs";
import type { ResolvedSiteSettings } from "@/config/site";
import { phoneHref, whatsappHref } from "./contact-utils";
import { ContactLink, TrackedWhatsAppLink } from "./contact-link";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { FaqExplorer } from "./faq-explorer";
import { PageHero } from "./page-hero";

const breadcrumbs = [
  { name: "Home", item: "/" },
  { name: "FAQs", item: "/faqs" },
] as const;

type FaqGroup = { key: string; title: string; faqs: PublishedFaq[] };

function groupFaqs(faqs: PublishedFaq[]): FaqGroup[] {
  const groups = new Map<string, FaqGroup>();
  for (const faq of faqs) {
    const key = faq.service?.slug ?? "general";
    const current = groups.get(key);
    if (current) current.faqs.push(faq);
    else
      groups.set(key, {
        key,
        title: faq.service?.title ?? "General questions",
        faqs: [faq],
      });
  }
  return [...groups.values()];
}

export function FaqsPage({ faqs, settings }: { faqs: PublishedFaq[]; settings: ResolvedSiteSettings }) {
  const groups = groupFaqs(faqs);
  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      {faqs.length > 0 ? (
        <FaqPageJsonLd
          faqs={faqs.map((faq) => ({
            question: faq.question,
            answer: faq.answer,
          }))}
        />
      ) : null}
      <PageHero
        breadcrumbs={breadcrumbs.map((item) => ({
          label: item.name,
          href: item.item,
        }))}
        eyebrow="FAQs"
        title="Questions about our work"
        description="Published answers about services, projects and enquiries."
      />
      <section className="section-tint"><Container className="section-space-generous">
        {groups.length === 0 ? (
          <EmptyState
            title="FAQs are being prepared"
            description="Published answers will appear here once they are available."
          />
        ) : (
          <FaqExplorer groups={groups} />
        )}
      </Container></section>
      <section className="section-gradient"><Container className="section-space text-center"><p className="eyebrow">Need a clear next step?</p><h2 className="mx-auto mt-3 max-w-2xl font-heading text-h2 font-semibold">Still have questions?</h2><p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-dark/75">Talk through your requirement with the Vakratund team and we will point you toward the right service.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/contact" className="inline-flex min-h-12 items-center gap-2 rounded-pill bg-dark px-5 font-semibold text-white transition-transform hover:-translate-y-0.5">Contact us <ArrowRight size={17} aria-hidden="true" /></Link>{settings.phones[0] ? <ContactLink href={phoneHref(settings.phones[0])} eventType="CALL" context="faqs-cta-phone" className="inline-flex min-h-12 items-center gap-2 rounded-pill border border-dark/40 px-5 font-semibold text-dark hover:bg-white/30"><Phone size={17} aria-hidden="true" />Call</ContactLink> : null}{whatsappHref(settings, { pageTitle: "FAQs page" }) ? <TrackedWhatsAppLink settings={settings} whatsappContext={{ pageTitle: "FAQs page" }} context="faqs-cta-whatsapp" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-pill border border-dark/40 px-5 font-semibold text-dark hover:bg-white/30"><WhatsAppIcon size={17} />WhatsApp</TrackedWhatsAppLink> : null}</div></Container></section>
    </>
  );
}
