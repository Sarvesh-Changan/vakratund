"use client";

import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Container } from "@/components/ui/container";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="bg-bg">
      <Container className="flex min-h-[60vh] items-center py-20">
        <div className="max-w-xl">
          <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-danger">Something went wrong</p>
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">We could not load this page.</h1>
          <p className="mt-5 text-lg leading-8 text-ink-muted">Please try again. If the issue continues, our team can help you directly with your construction or repair requirement.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={reset} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-line bg-surface px-5 font-semibold text-ink hover:bg-surface-alt"><RotateCcw size={18} aria-hidden="true" /> Try again</button>
            <Link href="/estimate" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-brand px-5 font-bold text-brand-ink hover:bg-brand/90">Get Free Quote <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
