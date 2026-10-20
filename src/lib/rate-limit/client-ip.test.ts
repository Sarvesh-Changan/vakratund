import { describe, expect, it } from "vitest";

import { getClientIp, resolveClientIp } from "@/lib/rate-limit/client-ip";

describe("client IP resolution", () => {
  it("prefers Vercel's forwarded address", () => {
    const request = new Request("http://localhost", { headers: { "x-vercel-forwarded-for": "203.0.113.10", "x-forwarded-for": "198.51.100.10", "x-real-ip": "192.0.2.10" } });
    expect(getClientIp(request)).toBe("203.0.113.10");
  });

  it("uses the first forwarded address and rejects invalid values", () => {
    const request = new Request("http://localhost", { headers: { "x-forwarded-for": "198.51.100.10, 10.0.0.1", "x-real-ip": "192.0.2.10" } });
    expect(resolveClientIp(request)).toMatchObject({ ip: "198.51.100.10", source: "x-forwarded-for" });
    expect(getClientIp(new Request("http://localhost", { headers: { "x-forwarded-for": "not-an-ip", "x-real-ip": "192.0.2.10" } }))).toBe("192.0.2.10");
  });

  it("returns unavailable instead of putting unknown callers into one address bucket", () => {
    expect(resolveClientIp(new Request("http://localhost"))).toEqual({ ip: null, source: "unavailable" });
  });
});
