import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PublishedFaq } from "@/server/queries/faqs";
import type { HomeFaqSection } from "@/server/queries/home";
import { Accordion, AccordionItem, Container, SectionHeading } from "@/components/ui";

export function HomeFaq({ faqs, section }: { faqs: PublishedFaq[]; section: HomeFaqSection | null }) {
  if (faqs.length === 0 || !section) return null;
  return <section className="section-tint"><Container className="section-space-generous"><SectionHeading eyebrow={section.eyebrow || undefined} title={section.title} action={<Link href="/faqs" className="inline-flex min-h-11 items-center gap-2 self-start rounded-control font-semibold text-accent-ink hover:underline">{section.viewAllLabel} <ArrowRight size={17} aria-hidden="true" /></Link>} /><div className="mt-10 max-w-4xl lg:mt-14"><Accordion>{faqs.slice(0, 5).map((faq, index) => <AccordionItem key={faq.id} title={faq.question} defaultOpen={index === 0}>{faq.answer}</AccordionItem>)}</Accordion></div></Container></section>;
}
