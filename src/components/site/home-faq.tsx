import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PublishedFaq } from "@/server/queries/faqs";
import { Accordion, AccordionItem, Container, SectionHeading } from "@/components/ui";

export function HomeFaq({ faqs }: { faqs: PublishedFaq[] }) {
  if (faqs.length === 0) return null;
  return <section className="bg-bg"><Container className="py-20 lg:py-28"><SectionHeading eyebrow="Common questions" title="Start with the details" action={<Link href="/faqs" className="inline-flex min-h-11 items-center gap-2 self-start rounded-control font-semibold text-brand-deep hover:underline">View all FAQs <ArrowRight size={17} aria-hidden="true" /></Link>} /><div className="mt-10 max-w-4xl"><Accordion>{faqs.slice(0, 5).map((faq, index) => <AccordionItem key={faq.id} title={faq.question} defaultOpen={index === 0}>{faq.answer}</AccordionItem>)}</Accordion></div></Container></section>;
}
