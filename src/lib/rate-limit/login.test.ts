import { beforeEach, describe, expect, it, vi } from "vitest";

const secret = "ip-hash-secret-for-login-tests-123456789";
vi.mock("@/lib/env", () => ({
  getEnv: () => ({ NODE_ENV: "test", IP_HASH_SECRET: secret }),
  getRequiredSecret: () => secret,
}));

import { checkLoginLimit, recordFailedLogin, resetLoginLimit, setLoginRateLimitStoreForTests } from "@/lib/rate-limit/login";
import { InMemoryLoginRateLimitStore } from "@/lib/rate-limit/store";

function request(ip: string, userAgent = "test-agent"): Request {
  return new Request("http://localhost/api/auth/sign-in/email", { method: "POST", headers: { "x-vercel-forwarded-for": ip, "user-agent": userAgent } });
}

describe("failure-only login policy", () => {
  beforeEach(() => setLoginRateLimitStoreForTests(new InMemoryLoginRateLimitStore()));

  it("allows five failures and blocks the next request with Retry-After data", async () => {
    const loginRequest = request("203.0.113.10");
    for (let attempt = 0; attempt < 5; attempt += 1) await recordFailedLogin(loginRequest, "admin@example.com");
    const result = await checkLoginLimit(loginRequest, "admin@example.com");
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets the matching counters after a successful login", async () => {
    const loginRequest = request("203.0.113.10");
    for (let attempt = 0; attempt < 5; attempt += 1) await recordFailedLogin(loginRequest, "admin@example.com");
    await resetLoginLimit(loginRequest, "admin@example.com");
    expect((await checkLoginLimit(loginRequest, "admin@example.com")).allowed).toBe(true);
  });

  it("separates IPs and uses a different fingerprint for missing IP", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) await recordFailedLogin(request("203.0.113.10"), "admin@example.com");
    expect((await checkLoginLimit(request("203.0.113.11"), "admin@example.com")).allowed).toBe(true);
    for (let attempt = 0; attempt < 5; attempt += 1) await recordFailedLogin(new Request("http://localhost", { headers: { "user-agent": "agent-a" } }), "other-admin@example.com");
    expect((await checkLoginLimit(new Request("http://localhost", { headers: { "user-agent": "agent-b" } }), "other-admin@example.com")).allowed).toBe(true);
  });
});
