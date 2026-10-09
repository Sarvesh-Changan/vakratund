import type { TrackingInput } from "@/lib/validation/leads";

const STORAGE_KEY = "vakratund-first-party-attribution";

type StoredAttribution = Omit<TrackingInput, "sourcePage" | "deviceType"> & {
  landingPath?: string;
};

function clean(value: string | null, max: number): string | undefined {
  if (!value) return undefined;
  const result = value.replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, max);
  return result || undefined;
}

function safeReferrer(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return clean(url.toString(), 500);
  } catch {
    return undefined;
  }
}

function readStored(): StoredAttribution {
  if (typeof window === "undefined") return {};
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "null",
    );
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as StoredAttribution;
  } catch {
    return {};
  }
}

export function captureFirstPartyAttribution(): void {
  if (typeof window === "undefined") return;
  const existing = readStored();
  if (Object.keys(existing).length > 0) return;

  const params = new URLSearchParams(window.location.search);
  const attribution: StoredAttribution = {
    landingPath: clean(window.location.pathname, 200),
    referrer: safeReferrer(document.referrer),
    utmSource: clean(params.get("utm_source"), 120),
    utmMedium: clean(params.get("utm_medium"), 120),
    utmCampaign: clean(params.get("utm_campaign"), 160),
    utmTerm: clean(params.get("utm_term"), 160),
    utmContent: clean(params.get("utm_content"), 160),
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Storage can be disabled; the form still submits with current-page data.
  }
}

export function getLeadTracking(sourcePage: string): TrackingInput {
  const stored = readStored();
  const deviceType =
    typeof window === "undefined"
      ? "unknown"
      : window.innerWidth < 768
        ? "mobile"
        : window.innerWidth < 1024
          ? "tablet"
          : "desktop";

  return {
    sourcePage: clean(sourcePage, 200),
    referrer: clean(stored.referrer ?? null, 500),
    utmSource: clean(stored.utmSource ?? null, 120),
    utmMedium: clean(stored.utmMedium ?? null, 120),
    utmCampaign: clean(stored.utmCampaign ?? null, 160),
    utmTerm: clean(stored.utmTerm ?? null, 160),
    utmContent: clean(stored.utmContent ?? null, 160),
    deviceType,
  };
}
