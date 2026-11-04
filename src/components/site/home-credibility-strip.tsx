import { Marquee } from "@/components/motion";
import type { ResolvedSiteSettings } from "@/config/site";
import type { HomeHero } from "@/server/queries/home";
import type { PublishedService } from "@/server/queries/services";

function labels(hero: HomeHero, settings: ResolvedSiteSettings, services: PublishedService[]) {
  return [...new Set([
    ...(hero.trustChips ?? []),
    ...settings.credentials.map((credential) => credential.label),
    settings.foundedYear ? `Since ${settings.foundedYear}` : "",
    ...services.slice(0, 2).map((service) => service.title),
    settings.address,
  ].map((label) => label.trim()).filter(Boolean))];
}

function BadgeList({ items }: { items: string[] }) {
  return <ul className="flex items-center gap-3 whitespace-nowrap"><li aria-hidden="true" className="size-1.5 rounded-full bg-accent" />{items.map((item) => <li key={item} className="rounded-pill border border-line bg-bg px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">{item}</li>)}</ul>;
}

export function HomeCredibilityStrip({ hero, settings, services }: { hero: HomeHero; settings: ResolvedSiteSettings; services: PublishedService[] }) {
  const items = labels(hero, settings, services);
  if (items.length === 0) return null;
  return (
    <section aria-label="Company credentials" className="section-light overflow-hidden border-b py-3 sm:py-4">
      <Marquee speed={40} direction="left" gap={16} pauseOnHover label="Company credentials">
        <BadgeList items={items} />
      </Marquee>
    </section>
  );
}
