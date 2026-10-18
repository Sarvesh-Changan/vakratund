import { ArrowRight, Phone, ShieldCheck } from "lucide-react";
import { CloudImage } from "@/components/cloud-image";
import { Parallax, Reveal, SplitText } from "@/components/motion";
import { Container } from "@/components/ui/container";
import type { HomeHero as HomeHeroContent, HomeHeroImage } from "@/server/queries/home";
import type { ResolvedSiteSettings } from "@/config/site";
import type { PublishedGalleryItem } from "@/server/queries/gallery";

function approvedTrustChips(hero: HomeHeroContent, settings: ResolvedSiteSettings): string[] {
  if (hero.trustChips?.length) return hero.trustChips;
  const msme = settings.credentials.find((credential) => `${credential.label} ${credential.value}`.toLowerCase().includes("msme"))?.label;
  const insured = settings.credentials.find((credential) => `${credential.label} ${credential.value}`.toLowerCase().includes("insur"))?.label;
  return [msme, insured, settings.foundedYear ? `Since ${settings.foundedYear}` : null].filter((value): value is string => Boolean(value));
}

const tilePositions = [
  "left-[2%] top-[12%] h-[30%] w-[22%] lg:left-[4%] lg:top-[14%] lg:h-[32%] lg:w-[20%]",
  "left-[25%] top-[5%] h-[23%] w-[24%] lg:left-[27%] lg:top-[7%] lg:h-[26%] lg:w-[22%]",
  "right-[2%] top-[9%] h-[27%] w-[27%] lg:right-[4%] lg:top-[12%] lg:h-[30%] lg:w-[25%]",
  "left-[8%] bottom-[10%] h-[25%] w-[25%] lg:left-[11%] lg:bottom-[8%] lg:h-[28%] lg:w-[23%]",
  "left-[37%] bottom-[4%] h-[30%] w-[25%] lg:left-[39%] lg:bottom-[6%] lg:h-[34%] lg:w-[23%]",
  "right-[8%] bottom-[11%] h-[24%] w-[24%] lg:right-[11%] lg:bottom-[10%] lg:h-[27%] lg:w-[22%]",
  "left-[2%] top-[46%] h-[17%] w-[15%] lg:left-[3%] lg:top-[48%] lg:h-[19%] lg:w-[14%]",
  "right-[1%] top-[45%] h-[18%] w-[15%] lg:right-[3%] lg:top-[46%] lg:h-[20%] lg:w-[14%]",
] as const;

export function HomeHero({ hero, image, gallery, settings }: { hero: HomeHeroContent; image: HomeHeroImage | null; gallery: PublishedGalleryItem[]; settings: ResolvedSiteSettings }) {
  const phoneCta = hero.secondaryHref.startsWith("tel:");
  const trustChips = approvedTrustChips(hero, settings);
  const galleryTiles = gallery.filter((item) => item.mediaType === "IMAGE").slice(0, 7);
  const images = image ? [{ url: image.url, alt: image.alt }, ...galleryTiles.map((item) => ({ url: item.url, alt: item.title }))] : galleryTiles.map((item) => ({ url: item.url, alt: item.title }));

  const title = hero.title?.trim() ?? "";
  const highlightWord = /\btrust\b/i.test(title) ? "trust" : title.split(/\s+/)[0] ?? "";
  return <section className="relative isolate flex min-h-[min(52rem,100svh)] overflow-hidden bg-dark text-white">
    <div className="absolute inset-0 -z-20 bg-dark" aria-hidden="true" />
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">{tilePositions.map((position, index) => { const tile = images[index]; return <Parallax key={`${tile?.url ?? "fallback"}-${index}`} speed={0.02 + index * 0.008} className={`absolute overflow-hidden rounded-[2rem] border border-white/10 shadow-raised ${position}`}><div className={tile ? "relative size-full" : "home-blueprint-pattern relative size-full bg-gradient-to-br from-dark via-dark to-accent/35"}>{tile ? <CloudImage src={tile.url} alt="" fill priority={index < 2} sizes="(min-width: 1024px) 28vw, 50vw" className="object-cover" /> : null}</div></Parallax>; })}{images.length === 0 && settings.foundedYear !== null ? <span className="absolute bottom-[16%] right-[18%] rounded-pill border border-accent-2/40 bg-dark/70 px-4 py-3 font-heading text-sm font-semibold text-accent-2 backdrop-blur-sm">Since {settings.foundedYear}</span> : null}</div>
    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgb(27_26_43_/_0.45)_45%,rgb(27_26_43_/_0.96)_100%)]" aria-hidden="true" />
    <div className="absolute inset-0 -z-10 bg-dark/45" aria-hidden="true" />
    <Container className="flex w-full items-center justify-center py-36 text-center sm:py-44">
      <Reveal priority className="max-w-5xl">
        {hero.eyebrow ? <p className="eyebrow mb-5 text-accent-2">{hero.eyebrow}</p> : null}
        {title ? <SplitText as="h1" priority highlight={highlightWord} className="max-w-5xl font-heading text-hero font-bold leading-[0.98] tracking-[-0.055em] text-white">{title}</SplitText> : null}
        {hero.description ? <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl">{hero.description}</p> : null}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a href={hero.primaryHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-accent px-6 font-bold text-accent-ink shadow-soft transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">{hero.primaryCta}<ArrowRight size={18} aria-hidden="true" /></a>
          {phoneCta ? <a href={hero.secondaryHref} data-contact-type="CALL" data-contact-context="home-hero-call" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-white/60 bg-white/10 px-6 font-bold text-white backdrop-blur-sm transition-transform hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-2"><Phone size={18} aria-hidden="true" />{hero.secondaryCta}</a> : <a href={hero.secondaryHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-white/60 bg-white/10 px-6 font-bold text-white backdrop-blur-sm transition-transform hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-2">{hero.secondaryCta}</a>}
        </div>
        {trustChips.length ? <ul aria-label="Trust credentials" className="mx-auto mt-9 flex max-w-3xl flex-wrap justify-center gap-2.5">{trustChips.map((chip) => <li key={chip} className="inline-flex min-h-10 items-center gap-2 rounded-pill border border-white/20 bg-white/10 px-3.5 py-2 text-sm text-white/90 backdrop-blur-sm"><ShieldCheck size={16} className="shrink-0 text-accent-2" aria-hidden="true" />{chip}</li>)}</ul> : null}
      </Reveal>
    </Container>
  </section>;
}
