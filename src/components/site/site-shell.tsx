import type { ReactNode } from "react";
import { resolveSiteSettings, type ResolvedSiteSettings } from "@/config/site";
import { GeneralContractorJsonLd } from "@/components/seo/json-ld";
import { getPublicSettings } from "@/server/queries/settings";
import { GlobalCtas } from "./global-ctas";
import { AnalyticsConsent } from "./analytics-consent";
import { AttributionCapture } from "./attribution-capture";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export async function SiteShell({ children, settings: providedSettings }: { children: ReactNode; settings?: ResolvedSiteSettings }) {
  const settings = providedSettings ?? resolveSiteSettings(await getPublicSettings().catch(() => null));

  return (
    <div className="min-h-screen bg-bg pb-[calc(4rem+env(safe-area-inset-bottom))] text-ink md:pb-0">
      <GeneralContractorJsonLd settings={settings} />
      <AttributionCapture />
      <AnalyticsConsent gaId={process.env.NEXT_PUBLIC_GA_ID?.trim() || undefined} />
      <a href="#main-content" className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-control bg-brand px-4 py-3 font-semibold text-brand-ink shadow-raised transition-transform focus:translate-y-0">Skip to content</a>
      <SiteHeader settings={settings} />
      <main id="main-content" tabIndex={-1} className="min-h-screen pt-20">{children}</main>
      <SiteFooter settings={settings} />
      <GlobalCtas settings={settings} />
    </div>
  );
}
