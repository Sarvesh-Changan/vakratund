"use client";

import { useState } from "react";
import { MotionProvider } from "@/components/motion";
import { AboutIllustration } from "./about-illustration";
import { RepairIllustration } from "./repair-illustration";
import { WaterproofIllustration } from "./waterproof-illustration";

const illustrations = [
  { title: "Construction", Component: AboutIllustration },
  { title: "Structural repair", Component: RepairIllustration },
  { title: "Terrace waterproofing", Component: WaterproofIllustration },
] as const;

export function IllustrationShowcase() {
  const [reducedMotion, setReducedMotion] = useState(false);

  return <MotionProvider forceReducedMotion={reducedMotion}>
    <div className="space-y-8">
      <label className="inline-flex min-h-11 items-center gap-3 rounded-control border border-line bg-bg px-4 text-sm font-semibold text-ink"><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} /> Force reduced motion preview</label>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {illustrations.flatMap(({ title, Component }) => [false, true].map((dark) => <article key={`${title}-${dark ? "dark" : "light"}`} data-theme={dark ? "dark" : "light"} className="overflow-hidden rounded-feature border border-line bg-bg text-ink shadow-soft">
          <div className="flex items-center justify-between gap-3 px-5 py-4"><h2 className="font-heading text-lg font-semibold">{title}</h2><span className="rounded-full border border-line px-3 py-1 text-xs font-semibold">{dark ? "Dark" : "Light"}</span></div>
          <div className="aspect-[4/3] border-t border-line bg-tint p-2"><Component className="size-full" /></div>
        </article>))}
      </div>
    </div>
  </MotionProvider>;
}

