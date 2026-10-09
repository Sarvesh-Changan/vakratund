import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ getRequiredSecret: vi.fn(() => "a".repeat(40)) }));

import { checkLeadSubmitLimit } from "./lead-submit";

describe("lead submission rate limits", () => {
  it("allows the first request and blocks after the short window limit", () => {
    const ip = `test-ip-${Date.now()}-${Math.random()}`;
    const phone = "+919821502956";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(checkLeadSubmitLimit(ip, phone).allowed).toBe(true);
    }
    expect(checkLeadSubmitLimit(ip, phone).allowed).toBe(false);
  });
});
