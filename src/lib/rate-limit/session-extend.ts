import { createHmac } from "node:crypto";

import { getEnv, getRequiredSecret } from "@/lib/env";
import { getClientIp, getRequestFingerprint } from "@/lib/rate-limit/client-ip";
import type { RateLimitResult } from "@/lib/rate-limit/limiter";
import { InMemoryLoginRateLimitStore, type LoginRateLimitStore } from "@/lib/rate-limit/store";

const EXTEND_LIMIT = { limit: 10, windowMs: 60 * 1000 } as const;
let storePromise: Promise<LoginRateLimitStore> | undefined;

function hash(value: string): string {
  return createHmac("sha256", getRequiredSecret("IP_HASH_SECRET")).update(value).digest("hex");
}

async function getStore(): Promise<LoginRateLimitStore> {
  if (storePromise) return storePromise;
  storePromise = (async () => {
    const environment = getEnv();
    if (environment.NODE_ENV === "development" || environment.NODE_ENV === "test") return new InMemoryLoginRateLimitStore();
    const { DatabaseLoginRateLimitStore } = await import("@/lib/rate-limit/database-store");
    return new DatabaseLoginRateLimitStore();
  })();
  return storePromise;
}

export function setSessionExtendRateLimitStoreForTests(store: LoginRateLimitStore | undefined): void {
  storePromise = store ? Promise.resolve(store) : undefined;
}

export async function checkSessionExtendLimit(request: Request, userId: string): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  const fingerprint = getRequestFingerprint(request) ?? "no-fingerprint";
  const identity = ip ? `ip:${ip}` : `fingerprint:${fingerprint}`;
  const key = hash(`session-extend:${userId}:${identity}`);
  return (await getStore()).consume(key, EXTEND_LIMIT.limit, EXTEND_LIMIT.windowMs);
}

export const SESSION_EXTEND_LIMITS = EXTEND_LIMIT;
