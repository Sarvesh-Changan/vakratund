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
  return <section aria-label="Company credentials" className="section-light overflow-hidden border-b py-4 sm:py-5"><div className="mx-auto hidden max-w-wide justify-center px-4 lg:flex lg:px-8"><BadgeList items={items} /></div><div className="lg:hidden"><Marquee label="Company credentials" durationSeconds={34}><div className="px-4"><BadgeList items={items} /></div></Marquee></div></section>;
}
