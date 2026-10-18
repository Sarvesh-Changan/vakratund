"use client";

import Link from "next/link";
import { useMotionPreference } from "@/components/motion";
import type { ResolvedSiteSettings } from "@/config/site";
import { ArrowUpRight } from "lucide-react";

function areaLabels(address: string): string[] {
  return [...new Set(address.split(/\s+and\s+|,/i).map((item) => item.trim()).filter(Boolean))].slice(0, 5);
}

export function HomeWhereWeWork({ settings }: { settings: ResolvedSiteSettings }) {
  const { ready, reducedMotion } = useMotionPreference();
  const areas = areaLabels(settings.address);
  const labels = areas.length ? areas : ["Project locations"];
  const positions = [["left-2", "top-8"], ["right-0", "top-24"], ["left-8", "bottom-12"], ["right-4", "bottom-4"], ["left-1/2", "top-0"]] as const;

  return <section className="section-light"><div className="mx-auto grid max-w-wide gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,.8fr)] lg:items-center lg:gap-20 lg:px-8 lg:py-28"><div className="home-orbit-wrap relative mx-auto aspect-square w-full max-w-[34rem]" data-motion-enabled={ready && !reducedMotion}><svg className="absolute inset-0 size-full text-line" viewBox="0 0 500 500" fill="none" aria-hidden="true"><ellipse cx="250" cy="250" rx="190" ry="104" stroke="currentColor" /><ellipse cx="250" cy="250" rx="190" ry="104" transform="rotate(62 250 250)" stroke="currentColor" /><ellipse cx="250" cy="250" rx="190" ry="104" transform="rotate(-62 250 250)" stroke="currentColor" /><circle cx="250" cy="250" r="7" fill="currentColor" /></svg><div className="home-orbit-network absolute inset-8" aria-hidden="true"><span className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-dark text-center text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-raised"><span className="flex h-full items-center justify-center px-3">{settings.businessName.replace(/^M\/s\.\s*/, "")}</span></span></div>{labels.map((label, index) => <span key={`${label}-${index}`} className={`absolute ${positions[index]?.[0] ?? "left-1/2"} ${positions[index]?.[1] ?? "top-1/2"} ${index === 4 ? "-translate-x-1/2" : ""} rounded-pill border border-line bg-bg px-3 py-2 text-xs font-semibold text-ink shadow-soft sm:px-4 sm:text-sm`}>{label}</span>)}</div><div className="max-w-xl"><p className="eyebrow">Where we work</p><h2 className="mt-3 font-heading text-h2 font-semibold">{settings.address}</h2><p className="mt-5 text-lg leading-8 text-ink-muted">{settings.tagline}</p><Link href="/contact" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-control bg-dark px-5 font-bold text-white shadow-soft transition-transform hover:-translate-y-0.5">Contact us <ArrowUpRight size={18} aria-hidden="true" /></Link></div></div></section>;
}
