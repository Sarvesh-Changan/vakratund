import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ getRequiredSecret: vi.fn(() => "a".repeat(40)) }));

import { BROCHURE_TOKEN_TTL_SECONDS, createBrochureToken, verifyBrochureToken } from "./brochure-token";

describe("brochure download tokens", () => {
  const now = Date.parse("2026-10-07T00:00:00.000Z");

  it("verifies before expiry and rejects after expiry", () => {
    const token = createBrochureToken("media-1", now);
    expect(verifyBrochureToken(token, now)).toEqual({ mediaId: "media-1" });
    expect(verifyBrochureToken(token, now + (BROCHURE_TOKEN_TTL_SECONDS + 1) * 1000)).toBeNull();
  });

  it("rejects tampered media identifiers", () => {
    const token = createBrochureToken("media-1", now);
    const [payload, signature] = token.split(".");
    const tamperedPayload = Buffer.from(JSON.stringify({ mediaId: "media-2", expiresAt: Math.floor(now / 1000) + 600 })).toString("base64url");
    expect(verifyBrochureToken(`${tamperedPayload}.${signature}`, now)).toBeNull();
    expect(payload).toBeTruthy();
  });
});
