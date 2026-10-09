"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-charcoal px-6 py-20 text-ink">
        <main className="mx-auto max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">Vakratund Construction</p>
          <h1 className="mt-5 text-4xl font-bold">We are repairing this page.</h1>
          <p className="mt-5 text-lg leading-8 text-ink-muted">An unexpected error occurred. Please try again or return to the home page.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={reset} className="min-h-12 rounded-control bg-brand px-5 font-bold text-brand-ink">Try again</button>
            <Link href="/" className="inline-flex min-h-12 items-center rounded-control border border-line px-5 font-semibold">Back home</Link>
          </div>
        </main>
      </body>
    </html>
  );
}
