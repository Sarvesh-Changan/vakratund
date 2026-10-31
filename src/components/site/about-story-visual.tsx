"use client";

import { useState } from "react";
import { CloudImage } from "@/components/cloud-image";
import { CountUp } from "@/components/motion";
import { cn } from "@/lib/utils";
import type { AboutSection } from "@/server/queries/about";
import { AboutIllustration } from "./illustrations/about-illustration";

export function AboutStoryVisual({ image, alt, caption, foundedYear, className }: { image: AboutSection["image"]; alt?: string; caption?: string; foundedYear: number; className?: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showPhoto = Boolean(image?.url) && !imageFailed;

  return <figure className="relative">
    <div className="relative">
      <div data-about-story-frame className={cn("relative aspect-[16/10] overflow-hidden rounded-feature border border-line bg-tint shadow-soft lg:aspect-[4/3]", className)}>
        {showPhoto && image ? <CloudImage src={image.url} alt={alt?.trim() || image.alt} fill priority sizes="(min-width: 1280px) 42vw, (min-width: 1024px) 40vw, 100vw" className="object-cover" onError={() => setImageFailed(true)} /> : <div className="relative size-full bg-tint p-1"><AboutIllustration className="size-full" /><span className="pointer-events-none absolute inset-3 rounded-[inherit] border border-line/50" aria-hidden="true" /></div>}
      </div>
      <div className="absolute -bottom-6 left-5 rounded-card border border-line bg-dark p-5 text-white shadow-raised sm:left-8"><p className="eyebrow text-accent-2">Since</p><p className="mt-1 font-heading text-4xl font-bold tabular-nums"><CountUp value={foundedYear} format="year" /></p></div>
    </div>
    {caption ? <figcaption className="mt-2 text-sm text-ink-muted">{caption}</figcaption> : null}
  </figure>;
}

