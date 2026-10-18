"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { CountUp, HoverCard, Marquee, MaskImage, MotionProvider, Parallax, Reveal, RevealGroup, ScrollProgress, SplitText } from "@/components/motion";

export function MotionShowcase() {
  const [simulateReduced, setSimulateReduced] = useState(false);
  return <MotionProvider forceReducedMotion={simulateReduced}>
    <ScrollProgress />
    <main className="min-h-screen bg-bg text-ink">
      <header className="bg-charcoal px-6 py-20 text-white"><div className="container-default mx-auto max-w-6xl"><p className="eyebrow text-brand">Development showcase</p><h1 className="mt-4 text-5xl font-bold">Motion system</h1><p className="mt-4 max-w-2xl text-white/70">Progressive enhancement, one-time reveals, and reduced-motion-safe interaction.</p><button type="button" aria-pressed={simulateReduced} onClick={() => setSimulateReduced((value) => !value)} className="mt-7 rounded-control border border-white/30 px-4 py-3 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">{simulateReduced ? "Reduced motion simulated" : "Simulate reduced motion"}</button></div></header>
      <div className="container-default mx-auto max-w-6xl space-y-20 px-6 py-16">
        <section className="space-y-5"><h2 className="text-3xl font-bold">Reveal and stagger</h2><RevealGroup className="grid gap-4 md:grid-cols-3"><Reveal className="rounded-panel bg-surface p-6 shadow-soft">Fade and rise, once</Reveal><Reveal className="rounded-panel bg-surface p-6 shadow-soft">Staggered by group</Reveal><Reveal className="rounded-panel bg-surface p-6 shadow-soft">Visible without JavaScript</Reveal></RevealGroup></section>
        <section className="space-y-5"><h2 className="text-3xl font-bold">Split text</h2><SplitText as="h2" className="text-4xl font-bold" mode="words">Engineering built on experience</SplitText><p className="text-sm text-ink-muted">The heading remains one accessible name.</p></section>
        <section className="space-y-5"><h2 className="text-3xl font-bold">Image curtain</h2><MaskImage className="aspect-[16/7] rounded-panel"><div className="flex size-full items-center justify-center bg-gradient-to-br from-brand to-charcoal text-3xl font-bold text-white">MaskImage demo</div></MaskImage></section>
        <section className="space-y-5"><h2 className="text-3xl font-bold">Count up</h2><p className="text-4xl font-bold text-brand-deep"><CountUp value={2003} prefix="Since " format="year" easing="easeOutCubic" /></p></section>
        <section className="space-y-5"><h2 className="text-3xl font-bold">Marquee</h2><Marquee label="Service examples" durationSeconds={24}><div className="flex gap-10 px-5 py-4 font-semibold"><span>Structural repair</span><span>Turnkey construction</span><span>Project management</span><span>Waterproofing</span></div></Marquee></section>
        <section className="space-y-5"><h2 className="text-3xl font-bold">Parallax</h2><Parallax className="flex min-h-56 items-center justify-center rounded-panel bg-surface-alt text-xl font-semibold">Native scroll timeline where available</Parallax></section>
        <section className="space-y-5"><h2 className="text-3xl font-bold">Hover card</h2><HoverCard className="max-w-sm rounded-panel bg-surface p-6 shadow-soft"><span className="font-semibold">Subtle lift, image zoom ≤ 1.05</span><ArrowRight data-hover-arrow="" className="ml-3 inline" size={18} aria-hidden="true" /></HoverCard></section>
      </div>
    </main>
  </MotionProvider>;
}
