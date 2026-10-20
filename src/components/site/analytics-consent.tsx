"use client";

import Script from "next/script";
import { useEffect, useState, type ReactNode } from "react";

const CONSENT_COOKIE = "vakratund_analytics_consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function readConsent(): boolean | false | null {
  if (typeof document === "undefined") return null;
  const value = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CONSENT_COOKIE}=`))
    ?.split("=")[1];
  return value === "accepted" ? true : value === "declined" ? false : null;
}

function writeConsent(value: "accepted" | "declined"): void {
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
}

export function AnalyticsConsent({ gaId }: { gaId?: string }): ReactNode {
  const [consent, setConsent] = useState<boolean | false | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setConsent(readConsent()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") window.__vakratundAnalyticsConsent = consent === true;
    return () => {
      if (typeof window !== "undefined") window.__vakratundAnalyticsConsent = false;
    };
  }, [consent]);

  if (!gaId || consent === null || consent === false) return null;

  const accepted = consent === true;
  return (
    <>
      {accepted ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`} strategy="afterInteractive" />
          <Script id="vakratund-google-analytics" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || []; window.gtag = function(){window.dataLayer.push(arguments);}; window.gtag('js', new Date()); window.gtag('config', ${JSON.stringify(gaId)}, { anonymize_ip: true });`}
          </Script>
        </>
      ) : (
        <aside role="region" aria-label="Analytics consent" className="fixed inset-x-3 bottom-3 z-[70] mx-auto flex max-w-2xl flex-col gap-3 rounded-panel border border-line bg-surface p-4 shadow-raised sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-ink-muted">We use optional analytics to improve this website. You can accept or decline.</p>
          <div className="flex shrink-0 gap-2">
            <button type="button" className="min-h-11 rounded-control border border-line px-4 text-sm font-semibold" onClick={() => { writeConsent("declined"); setConsent(false); }}>Decline</button>
            <button type="button" className="min-h-11 rounded-control bg-brand px-4 text-sm font-bold text-brand-ink" onClick={() => { writeConsent("accepted"); setConsent(true); }}>Accept</button>
          </div>
        </aside>
      )}
    </>
  );
}

export { CONSENT_COOKIE };
