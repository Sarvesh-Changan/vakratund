import { BreadcrumbJsonLd, FaqPageJsonLd } from "@/components/seo/json-ld";
import { Accordion, AccordionItem, Breadcrumbs, Container, EmptyState, SectionHeading } from "@/components/ui";
import { MarkdownRenderer } from "@/lib/markdown/renderer";
import type { PublishedFaq } from "@/server/queries/faqs";

const breadcrumbs = [{ name: "Home", item: "/" }, { name: "FAQs", item: "/faqs" }] as const;

type FaqGroup = { key: string; title: string; faqs: PublishedFaq[] };

function groupFaqs(faqs: PublishedFaq[]): FaqGroup[] {
  const groups = new Map<string, FaqGroup>();
  for (const faq of faqs) {
    const key = faq.service?.slug ?? "general";
    const current = groups.get(key);
    if (current) current.faqs.push(faq);
    else groups.set(key, { key, title: faq.service?.title ?? "General questions", faqs: [faq] });
  }
  return [...groups.values()];
}

export function FaqsPage({ faqs }: { faqs: PublishedFaq[] }) {
  const groups = groupFaqs(faqs);
  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      {faqs.length > 0 ? <FaqPageJsonLd faqs={faqs.map((faq) => ({ question: faq.question, answer: faq.answer }))} /> : null}
      <section className="bg-charcoal pt-32 text-white sm:pt-36"><Container className="pb-16 lg:pb-20"><Breadcrumbs items={breadcrumbs.map((item) => ({ label: item.name, href: item.item }))} className="text-white/65" /><p className="mt-10 text-sm font-semibold uppercase tracking-[0.14em] text-brand">FAQs</p><h1 className="mt-3 max-w-3xl font-heading text-4xl font-bold tracking-tight sm:text-5xl">Questions about our work</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">Published answers about services, projects and enquiries.</p></Container></section>
      <Container className="py-16 lg:py-24">
        {groups.length === 0 ? <EmptyState title="FAQs are being prepared" description="Published answers will appear here once they are available." /> : <div className="space-y-12">{groups.map((group) => <section key={group.key}><SectionHeading eyebrow={group.key === "general" ? "General" : "Service questions"} title={group.title} /><div className="mt-6"><Accordion>{group.faqs.map((faq, index) => <AccordionItem key={faq.id} title={faq.question} defaultOpen={index === 0}><MarkdownRenderer content={faq.answer} className="prose prose-sm max-w-none leading-7 text-ink-muted prose-a:text-brand-deep" /></AccordionItem>)}</Accordion></div></section>)}</div>}
      </Container>
    </>
  );
}
