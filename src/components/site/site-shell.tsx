import type { ReactNode } from "react";
import { resolveSiteSettings, type ResolvedSiteSettings } from "@/config/site";
import { GeneralContractorJsonLd } from "@/components/seo/json-ld";
import { getPublicSettings } from "@/server/queries/settings";
import { getPublishedServices } from "@/server/queries/services";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { GlobalCtas } from "./global-ctas";
import { AnalyticsConsent } from "./analytics-consent";
import { AttributionCapture } from "./attribution-capture";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export async function SiteShell({ children, settings: providedSettings, services: providedServices, overlayHeader = false }: { children: ReactNode; settings?: ResolvedSiteSettings; services?: Awaited<ReturnType<typeof getPublishedServices>>; overlayHeader?: boolean }) {
  const [settings, services] = await Promise.all([
    providedSettings ? Promise.resolve(providedSettings) : getPublicSettings().then(resolveSiteSettings).catch(() => resolveSiteSettings(null)),
    providedServices ? Promise.resolve(providedServices) : getPublishedServices().catch(() => []),
  ]);

  return (
    <div data-public-site className="site-public min-h-screen bg-bg pb-[calc(4rem+env(safe-area-inset-bottom))] text-ink md:pb-0">
      <GeneralContractorJsonLd settings={settings} />
      <ScrollProgress />
      <AttributionCapture />
      <AnalyticsConsent gaId={process.env.NEXT_PUBLIC_GA_ID?.trim() || undefined} />
      <a href="#main-content" className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-control bg-brand px-4 py-3 font-semibold text-brand-ink shadow-raised transition-transform focus:translate-y-0">Skip to content</a>
      <SiteHeader settings={settings} services={services} overlayAtTop={overlayHeader} />
      <main id="main-content" tabIndex={-1} className={overlayHeader ? "site-home-main site-page-load min-h-screen" : "site-page-load min-h-screen pt-20"}>{children}</main>
      <SiteFooter settings={settings} services={services} />
      <GlobalCtas settings={settings} />
    </div>
  );
}
