import { BreadcrumbJsonLd, FaqPageJsonLd } from "@/components/seo/json-ld";
import { Reveal, RevealGroup } from "@/components/motion";
import {
  Accordion,
  AccordionItem,
  Container,
  EmptyState,
  SectionHeading,
} from "@/components/ui";
import { MarkdownRenderer } from "@/lib/markdown/renderer";
import type { PublishedFaq } from "@/server/queries/faqs";
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

export function FaqsPage({ faqs }: { faqs: PublishedFaq[] }) {
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
      <Container className="py-16 lg:py-24">
        {groups.length === 0 ? (
          <EmptyState
            title="FAQs are being prepared"
            description="Published answers will appear here once they are available."
          />
        ) : (
          <RevealGroup className="space-y-12">
            {groups.map((group) => (
              <Reveal key={group.key}>
                <section>
                  <SectionHeading
                    eyebrow={
                      group.key === "general" ? "General" : "Service questions"
                    }
                    title={group.title}
                  />
                  <div className="mt-6">
                    <Accordion>
                      {group.faqs.map((faq, index) => (
                        <AccordionItem
                          key={faq.id}
                          title={faq.question}
                          defaultOpen={index === 0}
                        >
                          <MarkdownRenderer
                            content={faq.answer}
                            className="prose prose-sm max-w-none leading-7 text-ink-muted prose-a:text-brand-deep"
                          />
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </section>
              </Reveal>
            ))}
          </RevealGroup>
        )}
      </Container>
    </>
  );
}
