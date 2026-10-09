import { ArrowRight, Calculator } from "lucide-react";
import Link from "next/link";
import type { HomeCta } from "@/server/queries/home";
import { Container, Reveal } from "@/components/ui";

export function HomeEstimatorTeaser() {
  return <section className="bg-charcoal text-white"><Container className="py-16 lg:py-20"><Reveal className="grid gap-8 rounded-panel border border-white/10 bg-white/5 p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-brand">Planning a project?</p><h2 className="mt-3 text-3xl font-bold">Start with an indicative estimate.</h2><p className="mt-4 max-w-2xl text-white/65">Use the database-driven estimator to share your requirements. Final quotation follows site inspection.</p></div><Link href="/estimate" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-brand px-5 font-bold text-brand-ink hover:bg-brand/90"><Calculator size={18} aria-hidden="true" /> Estimate a project</Link></Reveal></Container></section>;
}

export function HomeFinalCta({ cta }: { cta: HomeCta | null }) {
  if (!cta) return null;
  return <section className="bg-brand"><Container className="py-16 lg:py-20"><Reveal className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between"><div className="max-w-2xl"><h2 className="text-3xl font-bold text-brand-ink sm:text-4xl">{cta.title}</h2>{cta.description ? <p className="mt-4 text-lg leading-8 text-brand-ink/75">{cta.description}</p> : null}</div><div className="flex flex-col gap-3 sm:flex-row"><a href={cta.primaryHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-brand-ink px-5 font-bold text-brand hover:bg-brand-ink/90">{cta.primaryCta} <ArrowRight size={18} aria-hidden="true" /></a>{cta.secondaryCta && cta.secondaryHref ? <a href={cta.secondaryHref} className="inline-flex min-h-12 items-center justify-center rounded-control border border-brand-ink/30 px-5 font-semibold text-brand-ink hover:bg-brand-ink/10">{cta.secondaryCta}</a> : null}</div></Reveal></Container></section>;
}
