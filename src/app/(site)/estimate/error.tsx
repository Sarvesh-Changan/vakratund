"use client";

import { Button, Card } from "@/components/ui";

export default function EstimateError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <Card><h1 className="font-heading text-2xl font-bold">The estimator could not load</h1><p className="mt-3 text-ink-muted">Please try again, or contact us directly if you need help with a project enquiry.</p><Button type="button" className="mt-6" onClick={reset}>Try again</Button></Card>;
}
