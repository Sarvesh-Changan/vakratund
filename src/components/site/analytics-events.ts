export type AnalyticsEventName = "generate_lead" | "click_call" | "click_whatsapp" | "estimate_completed" | "estimate_started" | "estimate_step_viewed" | "estimate_range_viewed" | "estimate_extras_opened" | "estimate_submitted";

type AnalyticsParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (command: string, eventName: string, params?: AnalyticsParams) => void;
    __vakratundAnalyticsConsent?: boolean;
  }
}

export function trackAnalyticsEvent(name: AnalyticsEventName, params: AnalyticsParams = {}): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  } else if (window.__vakratundAnalyticsConsent) {
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push(["event", name, params]);
  }
}
