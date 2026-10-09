import { ArrowRight, Phone, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/motion";
import type { HomeHero, HomeHeroImage } from "@/server/queries/home";
import type { ResolvedSiteSettings } from "@/config/site";
import { CloudImage } from "@/components/cloud-image";

export function HomeHero({ hero, image, settings }: { hero: HomeHero; image: HomeHeroImage | null; settings: ResolvedSiteSettings }) {
  const msme = settings.credentials.find((credential) => `${credential.label} ${credential.value}`.toLowerCase().includes("msme"));
  const insured = settings.credentials.find((credential) => `${credential.label} ${credential.value}`.toLowerCase().includes("insur"));
  const phoneCta = hero.secondaryHref.startsWith("tel:");

  return (
    <section className="relative isolate overflow-hidden bg-charcoal text-white">
      {image ? <div className="absolute inset-0 -z-10"><CloudImage src={image.url} alt={image.alt} fill priority sizes="100vw" className="object-cover" /></div> : null}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-charcoal via-charcoal/90 to-charcoal/50" aria-hidden="true" />
      <Container className="flex min-h-[620px] items-end py-24 sm:min-h-[680px] lg:items-center lg:py-28">
        <Reveal className="max-w-3xl">
          <div className="mb-6 flex flex-wrap gap-2" aria-label="Trust credentials">
            <span className="inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80"><ShieldCheck size={16} className="text-brand" aria-hidden="true" />{msme?.label || "MSME registered"}</span>
            <span className="inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80"><ShieldCheck size={16} className="text-brand" aria-hidden="true" />{insured?.label || "Insured workforce"}</span>
            <span className="inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80"><ShieldCheck size={16} className="text-brand" aria-hidden="true" />Since {settings.foundedYear}</span>
          </div>
          {hero.eyebrow ? <p className="mb-4 font-heading text-sm font-bold uppercase tracking-[0.18em] text-brand">{hero.eyebrow}</p> : null}
          <h1 className="max-w-3xl text-[clamp(2.5rem,7vw,5.25rem)] font-bold leading-[1.04] tracking-[-0.045em]">{hero.title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">{hero.description}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href={hero.primaryHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-brand px-6 font-bold text-brand-ink hover:bg-brand/90">{hero.primaryCta} <ArrowRight size={18} aria-hidden="true" /></a>
            {phoneCta ? <a href={hero.secondaryHref} data-contact-type="CALL" data-contact-context="home-hero-call" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-white/25 px-6 font-bold text-white hover:border-white hover:bg-white/10"><Phone size={18} aria-hidden="true" /> {hero.secondaryCta}</a> : <a href={hero.secondaryHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-white/25 px-6 font-bold text-white hover:border-white hover:bg-white/10"><Phone size={18} aria-hidden="true" /> {hero.secondaryCta}</a>}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
