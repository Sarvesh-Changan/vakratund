"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ResolvedSiteSettings } from "@/config/site";
import { HomeMapOrbit } from "./home-map-orbit";

export function HomeWhereWeWork({ settings }: { settings?: ResolvedSiteSettings }) {
  return (
    <section className="section-light bg-surface border-y border-line/40 overflow-hidden">
      <div className="mx-auto grid max-w-wide gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:items-center lg:gap-16 lg:px-8 lg:py-24">
        {/* Left: Maharashtra Map & 3D Rotating Navy Sphere */}
        <div className="flex items-center justify-center">
          <HomeMapOrbit />
        </div>

        {/* Right: Where We Work Editorial Content */}
        <div className="max-w-xl">
          <p className="font-bold text-xs uppercase tracking-widest text-purple-600 sm:text-sm">
            WHERE WE WORK
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl leading-tight">
            All Over
            <br />
            Maharashtra
          </h2>
          <p className="mt-4 text-base sm:text-lg text-ink-muted leading-relaxed">
            {settings?.tagline || "Quality is our first priority"}
          </p>
          <div className="mt-8">
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center gap-2 rounded-control bg-dark px-6 py-3 font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-dark/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dark"
            >
              Contact us
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
