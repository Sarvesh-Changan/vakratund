import { ArrowRight } from "lucide-react";
import type { HomeProcess } from "@/server/queries/home";
import { Container, Reveal, SectionHeading } from "@/components/ui";

export function HomeProcess({ process }: { process: HomeProcess | null }) {
  if (!process) return null;
  return <section className="bg-bg"><Container className="py-20 lg:py-28"><SectionHeading eyebrow="How we work" title={process.title} /><div className="mt-12 grid gap-8 md:grid-cols-4">{process.steps.map((step, index) => <Reveal key={`${step.title}-${index}`} className="relative"><div className="flex size-12 items-center justify-center rounded-full bg-brand font-heading font-bold text-brand-ink">{index + 1}</div><h3 className="mt-5 font-heading text-xl font-semibold">{step.title}</h3>{step.description ? <p className="mt-2 text-sm leading-7 text-ink-muted">{step.description}</p> : null}{index < process.steps.length - 1 ? <ArrowRight className="absolute right-0 top-5 hidden text-brand-deep md:block" size={20} aria-hidden="true" /> : null}</Reveal>)}</div></Container></section>;
}
