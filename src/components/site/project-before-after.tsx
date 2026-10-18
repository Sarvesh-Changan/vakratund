"use client";

import { useState } from "react";
import { CloudImage } from "@/components/cloud-image";
import type { PublishedProjectMedia } from "@/server/queries/projects";

export function ProjectBeforeAfter({ before, after }: { before: PublishedProjectMedia; after: PublishedProjectMedia }) {
  const [position, setPosition] = useState(50);
  return <div className="relative overflow-hidden rounded-card border border-line bg-dark">
    <div className="relative aspect-[16/10]">
      <CloudImage src={after.url} alt={after.alt} fill sizes="(min-width: 1024px) 70vw, 100vw" className="object-cover" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}><CloudImage src={before.url} alt={before.alt} fill sizes="(min-width: 1024px) 70vw, 100vw" className="object-cover" /></div>
      <span className="absolute left-4 top-4 rounded-pill bg-dark/75 px-3 py-1 text-xs font-semibold text-white">Before</span>
      <span className="absolute right-4 top-4 rounded-pill bg-dark/75 px-3 py-1 text-xs font-semibold text-white">After</span>
      <div className="pointer-events-none absolute inset-y-0" style={{ left: `${position}%` }}><span className="absolute inset-y-0 w-px bg-white shadow-raised" /><span className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white bg-dark text-white" aria-hidden="true">{"\u2194"}</span></div>
      <label className="sr-only" htmlFor="before-after-position">Compare before and after</label>
      <input id="before-after-position" type="range" min="0" max="100" value={position} onChange={(event) => setPosition(Number(event.target.value))} className="absolute inset-x-4 bottom-4 z-10 w-[calc(100%-2rem)] accent-accent" />
    </div>
  </div>;
}
