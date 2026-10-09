import { describe, expect, it } from "vitest";

import { InMemoryRateLimiter } from "@/lib/rate-limit/limiter";

describe("InMemoryRateLimiter", () => {
  it("allows the configured attempts and blocks the next one", () => {
    const limiter = new InMemoryRateLimiter();
    expect(limiter.check("login", 5, 60_000).allowed).toBe(true);
    expect(limiter.check("login", 5, 60_000).allowed).toBe(true);
    expect(limiter.check("login", 5, 60_000).allowed).toBe(true);
    expect(limiter.check("login", 5, 60_000).allowed).toBe(true);
    expect(limiter.check("login", 5, 60_000).allowed).toBe(true);
    expect(limiter.check("login", 5, 60_000).allowed).toBe(false);
  });

  it("resets a key", () => {
    const limiter = new InMemoryRateLimiter();
    limiter.check("login", 1, 60_000);
    limiter.reset("login");
    expect(limiter.check("login", 1, 60_000).allowed).toBe(true);
  });
});
