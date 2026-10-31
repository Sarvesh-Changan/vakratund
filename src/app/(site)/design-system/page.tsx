import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { IllustrationShowcase } from "@/components/site/illustrations/illustration-showcase";

export const metadata: Metadata = { title: "Design system illustrations | Vakratund Construction", robots: { index: false, follow: false } };

export default function DesignSystemPage() {
  return <section className="section-light"><Container className="section-space-generous"><p className="eyebrow">Design system</p><h1 className="mt-3 font-heading text-h1 font-semibold">Original construction illustrations</h1><p className="mt-4 max-w-2xl text-ink-muted">Inline vector artwork uses the active theme tokens. The reduced-motion preview keeps every scene still.</p><div className="mt-10"><IllustrationShowcase /></div></Container></section>;
}

