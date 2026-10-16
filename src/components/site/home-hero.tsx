import { ArrowRight, Phone, ShieldCheck } from "lucide-react";
import { CloudImage } from "@/components/cloud-image";
import { Parallax, Reveal, SplitText } from "@/components/motion";
import { Container } from "@/components/ui/container";
import type { HomeHero as HomeHeroContent, HomeHeroImage } from "@/server/queries/home";
import type { ResolvedSiteSettings } from "@/config/site";

function approvedTrustChips(hero: HomeHeroContent, settings: ResolvedSiteSettings): string[] {
  if (hero.trustChips?.length) return hero.trustChips;
  const msme = settings.credentials.find((credential) => `${credential.label} ${credential.value}`.toLowerCase().includes("msme"))?.label;
  const insured = settings.credentials.find((credential) => `${credential.label} ${credential.value}`.toLowerCase().includes("insur"))?.label;
  return [msme, insured, settings.foundedYear ? `Since ${settings.foundedYear}` : null].filter((value): value is string => Boolean(value));
}

export function HomeHero({ hero, image, settings }: { hero: HomeHeroContent; image: HomeHeroImage | null; settings: ResolvedSiteSettings }) {
  const phoneCta = hero.secondaryHref.startsWith("tel:");
  const trustChips = approvedTrustChips(hero, settings);

  return <section className="relative isolate flex min-h-[min(52rem,100svh)] overflow-hidden bg-charcoal text-white">
    {image ? <Parallax speed={0.08} className="absolute inset-x-0 -top-[4%] -bottom-[4%] -z-10" aria-hidden="true"><CloudImage src={image.url} alt="" fill priority sizes="100vw" className="object-cover" /></Parallax> : <div className="absolute inset-0 -z-10 bg-gradient-to-br from-charcoal via-charcoal to-brand-deep/35" aria-hidden="true" />}
    {!image ? <div className="home-blueprint-pattern absolute inset-0 -z-10" aria-hidden="true" /> : null}
    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-charcoal/95 via-charcoal/75 to-charcoal/30" aria-hidden="true" />
    <Container className="flex w-full items-end pb-16 pt-36 sm:pb-20 lg:items-center lg:py-32">
      <Reveal priority className="max-w-5xl">
        {hero.eyebrow ? <p className="eyebrow mb-5 text-brand">{hero.eyebrow}</p> : null}
        {hero.title ? <SplitText as="h1" priority className="max-w-5xl text-hero font-bold leading-[0.98] text-white">{hero.title}</SplitText> : null}
        {hero.description ? <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl">{hero.description}</p> : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a href={hero.primaryHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-brand px-6 font-bold text-brand-ink transition-colors hover:bg-brand/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">{hero.primaryCta}<ArrowRight size={18} aria-hidden="true" /></a>
          {phoneCta ? <a href={hero.secondaryHref} data-contact-type="CALL" data-contact-context="home-hero-call" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-white/30 px-6 font-bold text-white transition-colors hover:border-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"><Phone size={18} aria-hidden="true" />{hero.secondaryCta}</a> : <a href={hero.secondaryHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-white/30 px-6 font-bold text-white transition-colors hover:border-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">{hero.secondaryCta}</a>}
        </div>
        {trustChips.length ? <ul aria-label="Trust credentials" className="mt-9 flex flex-wrap gap-2.5">{trustChips.map((chip) => <li key={chip} className="inline-flex min-h-10 items-center gap-2 rounded-pill border border-white/20 bg-white/10 px-3.5 py-2 text-sm text-white/90 backdrop-blur-sm"><ShieldCheck size={16} className="shrink-0 text-brand" aria-hidden="true" />{chip}</li>)}</ul> : null}
      </Reveal>
    </Container>
  </section>;
}
