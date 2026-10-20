import { describe, expect, it } from "vitest";

import { InMemoryLoginRateLimitStore } from "@/lib/rate-limit/store";

describe("login rate-limit store contract", () => {
  it("increments failed attempts, locks at the limit, and resets", async () => {
    const store = new InMemoryLoginRateLimitStore();
    for (let attempt = 0; attempt < 4; attempt += 1) expect((await store.consume("pair", 5, 900_000, { emailHash: "email" })).allowed).toBe(true);
    const fifth = await store.consume("pair", 5, 900_000, { emailHash: "email" });
    expect(fifth).toMatchObject({ allowed: true, remaining: 0 });
    expect((await store.consume("pair", 5, 900_000, { emailHash: "email" })).allowed).toBe(false);
    await store.reset("pair");
    expect((await store.consume("pair", 5, 900_000, { emailHash: "email" })).allowed).toBe(true);
    await store.resetEmail("email");
    expect(await store.activeForEmail("email")).toEqual([]);
  });

  it("keeps two IP buckets separate and does not share a missing-IP bucket", async () => {
    const store = new InMemoryLoginRateLimitStore();
    expect((await store.consume("ip-a", 1, 900_000)).allowed).toBe(true);
    expect((await store.consume("ip-b", 1, 900_000)).allowed).toBe(true);
    expect((await store.consume("fingerprint-a", 1, 900_000)).allowed).toBe(true);
    expect((await store.consume("fingerprint-b", 1, 900_000)).allowed).toBe(true);
  });
});
