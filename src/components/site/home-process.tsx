import type { HomeProcess } from "@/server/queries/home";
import { ScrollLinkedProgress } from "@/components/motion";
import { Container, SectionHeading } from "@/components/ui";

export function HomeProcess({ process }: { process: HomeProcess | null }) {
  if (!process) return null;
  return <section className="bg-surface"><Container className="section-space-generous"><SectionHeading eyebrow={process.eyebrow || undefined} title={process.title} /><ScrollLinkedProgress className="mt-10 md:mt-14"><ol className="relative z-10 grid gap-7 md:grid-cols-4 md:gap-5">{process.steps.map((step, index) => <li key={`${step.title}-${index}`} className="flex gap-5 md:block md:text-center"><span className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-brand bg-surface font-heading font-bold text-brand-deep shadow-soft md:mx-auto">{String(index + 1).padStart(2, "0")}</span><div className="pt-1 md:pt-5"><h3 className="font-heading text-xl font-semibold text-ink">{step.title}</h3>{step.description ? <p className="mt-2 text-sm leading-7 text-ink-muted">{step.description}</p> : null}</div></li>)}</ol></ScrollLinkedProgress></Container></section>;
}
