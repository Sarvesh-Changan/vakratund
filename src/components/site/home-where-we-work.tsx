"use client";

import Link from "next/link";
import type { ResolvedSiteSettings } from "@/config/site";
import { ArrowUpRight } from "lucide-react";
import { HomeMapOrbit } from "./home-map-orbit";

export function HomeWhereWeWork({ settings }: { settings: ResolvedSiteSettings }) {
  return (
    <section className="section-light">
      <div className="mx-auto grid max-w-wide gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,.8fr)] lg:items-center lg:gap-20 lg:px-8 lg:py-28">
        <HomeMapOrbit />

        <div className="max-w-xl">
          <p className="eyebrow">Where we work</p>
          <h2 className="mt-3 font-heading text-h2 font-semibold">{settings.address}</h2>
          <p className="mt-5 text-lg leading-8 text-ink-muted">{settings.tagline}</p>
          <Link
            href="/contact"
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-control bg-dark px-5 font-bold text-white shadow-soft transition-transform hover:-translate-y-0.5"
          >
            Contact us
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

