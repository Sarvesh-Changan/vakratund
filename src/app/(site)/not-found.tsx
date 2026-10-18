import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PublicQuickLinks } from "@/components/site/public-quick-links";

export default function SiteNotFound() {
  return (
    <section className="section-light">
      <Container className="section-space"><div className="mx-auto max-w-4xl">
        <div className="max-w-xl">
          <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-brand-deep">Error 404</p>
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">That page has moved.</h1>
          <p className="mt-5 text-lg leading-8 text-ink-muted">The page you are looking for is unavailable or no longer published. Explore our services or request a project estimate instead.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-line bg-surface px-5 font-semibold text-ink hover:bg-surface-alt"><ArrowLeft size={18} aria-hidden="true" /> Back home</Link>
            <Link href="/estimate" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-brand px-5 font-bold text-brand-ink hover:bg-brand/90">Get Free Quote <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
        </div>
        <div className="mt-14"><p className="eyebrow text-accent-ink">Quick links</p><div className="mt-5"><PublicQuickLinks /></div></div>
      </div></Container>
    </section>
  );
}
