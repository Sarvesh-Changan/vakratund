import { isIP } from "node:net";

const IP_HEADERS = ["x-vercel-forwarded-for", "x-forwarded-for", "x-real-ip"] as const;

export type ClientIpResolution = {
  ip: string | null;
  source: (typeof IP_HEADERS)[number] | "unavailable";
};

function normalizeCandidate(value: string): string | null {
  const candidate = value.trim().replace(/^\[|\]$/g, "");
  return isIP(candidate) ? candidate : null;
}

function firstHeaderIp(value: string | null): string | null {
  if (!value) return null;
  return normalizeCandidate(value.split(",")[0] ?? "");
}

/** Resolve the client address from headers that Vercel sets at the edge. */
export function resolveClientIp(request: Request): ClientIpResolution {
  for (const header of IP_HEADERS) {
    const ip = firstHeaderIp(request.headers.get(header));
    if (ip) return { ip, source: header };
  }
  return { ip: null, source: "unavailable" };
}

export function getClientIp(request: Request): string | null {
  return resolveClientIp(request).ip;
}

export function getRequestFingerprint(request: Request): string | null {
  const parts = [
    request.headers.get("user-agent"),
    request.headers.get("accept-language"),
    request.headers.get("sec-ch-ua"),
    request.headers.get("sec-ch-ua-platform"),
  ].filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim().slice(0, 256));
  return parts.length > 0 ? parts.join("|") : null;
}
