import { ArrowRight, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import type { HomeHero as HomeHeroContent } from "@/server/queries/home";

export function HomeHero({ hero }: { hero: HomeHeroContent; [key: string]: unknown }) {
  const phoneCta = hero.secondaryHref.startsWith("tel:");
  const title = hero.title?.trim() ?? "";

  return (
    <section className="relative isolate flex min-h-[min(50rem,100svh)] overflow-hidden bg-hero-bg text-hero-ink">
      {/* Background Line-Art Decoration */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        {/* TOP-LEFT: small box */}
        <div className="hero-drift-left absolute left-[2%] top-[6%] hidden h-24 w-24 rounded-[1.25rem] border border-hero-line/70 sm:block lg:h-28 lg:w-28" />

        {/* MID-LEFT: medium box with grid */}
        <div className="hero-drift-left absolute -left-6 top-[22%] hidden h-56 w-56 rounded-[2rem] border border-hero-line/75 sm:block lg:-left-2 lg:h-64 lg:w-64">
          <div className="relative size-full">
            <div className="absolute inset-x-0 top-1/3 border-b border-hero-line/40" />
            <div className="absolute inset-x-0 top-2/3 border-b border-hero-line/40" />
            <div className="absolute inset-y-0 left-1/3 border-r border-hero-line/40" />
            <div className="absolute inset-y-0 left-2/3 border-r border-hero-line/40" />
          </div>
        </div>

        {/* BOTTOM-LEFT: large prominent box with grid */}
        <div className="hero-drift-left absolute -bottom-10 -left-4 h-52 w-52 rounded-[2rem] border border-hero-line/80 sm:h-72 sm:w-72 lg:h-80 lg:w-80">
          <div className="relative size-full">
            <div className="absolute inset-x-0 top-1/4 border-b border-hero-line/45" />
            <div className="absolute inset-x-0 top-1/2 border-b border-hero-line/45" />
            <div className="absolute inset-x-0 top-3/4 border-b border-hero-line/45" />
            <div className="absolute inset-y-0 left-1/4 border-r border-hero-line/45" />
            <div className="absolute inset-y-0 left-1/2 border-r border-hero-line/45" />
            <div className="absolute inset-y-0 left-3/4 border-r border-hero-line/45" />
          </div>
        </div>

        {/* TOP-RIGHT: medium box with grid */}
        <div className="hero-drift-right absolute -right-8 top-[8%] hidden h-48 w-48 rounded-[2rem] border border-hero-line/70 sm:block lg:-right-4 lg:h-56 lg:w-56">
          <div className="relative size-full">
            <div className="absolute inset-x-0 top-1/2 border-b border-hero-line/40" />
            <div className="absolute inset-y-0 left-1/2 border-r border-hero-line/40" />
          </div>
        </div>

        {/* MID-RIGHT: large box with fine grid */}
        <div className="hero-drift-right absolute -right-10 top-[30%] hidden h-72 w-72 rounded-[2.5rem] border border-hero-line/80 sm:block lg:-right-6 lg:h-80 lg:w-80">
          <div className="relative size-full">
            <div className="absolute inset-x-0 top-1/3 border-b border-hero-line/45" />
            <div className="absolute inset-x-0 top-2/3 border-b border-hero-line/45" />
            <div className="absolute inset-y-0 left-1/3 border-r border-hero-line/45" />
            <div className="absolute inset-y-0 left-2/3 border-r border-hero-line/45" />
          </div>
        </div>

        {/* BOTTOM-RIGHT: small accent box */}
        <div className="hero-drift-right absolute bottom-[8%] right-[2%] hidden h-20 w-20 rounded-[1rem] border border-hero-line/60 sm:block lg:h-24 lg:w-24" />
      </div>

      <Container className="flex w-full items-center justify-center py-36 text-center sm:py-44">
        <div className="max-w-5xl">
          {hero.eyebrow ? (
            <p className="eyebrow mb-5 text-hero-ink-muted">{hero.eyebrow}</p>
          ) : null}

          {title ? (
            <h1 className="mx-auto max-w-4xl font-heading text-hero font-bold leading-[0.98] tracking-[-0.055em] text-hero-ink">
              {title}
            </h1>
          ) : null}

          {hero.description ? (
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-hero-ink-muted sm:text-xl">
              {hero.description}
            </p>
          ) : null}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={hero.primaryHref}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-hero-ink px-6 font-bold text-white shadow-soft transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hero-ink"
            >
              {hero.primaryCta}
              <ArrowRight size={18} aria-hidden="true" />
            </a>

            <a
              href={hero.secondaryHref}
              data-contact-type={phoneCta ? "CALL" : undefined}
              data-contact-context={phoneCta ? "home-hero-call" : undefined}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-hero-ink/35 bg-transparent px-6 font-bold text-hero-ink transition-transform hover:-translate-y-0.5 hover:border-hero-ink hover:bg-hero-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hero-ink"
            >
              <Phone size={18} aria-hidden="true" />
              {hero.secondaryCta}
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
