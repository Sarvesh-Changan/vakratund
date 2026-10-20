import { createHash, createHmac, randomUUID } from "node:crypto";

import { getEnv, getRequiredSecret } from "@/lib/env";
import { getClientIp, getRequestFingerprint, resolveClientIp } from "@/lib/rate-limit/client-ip";
import type { RateLimitResult } from "@/lib/rate-limit/limiter";
import { InMemoryLoginRateLimitStore, type LoginRateLimitStore, type RateLimitStoreName, resultForBucket } from "@/lib/rate-limit/store";

export const LOGIN_LIMITS = {
  ipEmail: { limit: 5, windowMs: 15 * 60 * 1000 },
  ip: { limit: 20, windowMs: 15 * 60 * 1000 },
  email: { limit: 10, windowMs: 60 * 60 * 1000 },
} as const;

type LoginKeys = { pair: string; ip: string; email: string; emailHash: string; ipAddress: string | null };
type LoginLimitStatus = RateLimitResult & { clientIpResolved: boolean; source: ReturnType<typeof resolveClientIp>["source"] };

let storePromise: Promise<LoginRateLimitStore> | undefined;
let warnedAboutMissingIp = false;

function hashIdentifier(value: string): string {
  return createHmac("sha256", getRequiredSecret("IP_HASH_SECRET")).update(value).digest("hex");
}

function normalizedEmail(email: string): string {
  return email.trim().toLowerCase().slice(0, 254);
}

function keyDetails(request: Request, email: string): LoginKeys {
  const resolution = resolveClientIp(request);
  const emailHash = hashIdentifier(`email:${normalizedEmail(email)}`);
  const ipHash = resolution.ip ? hashIdentifier(`ip:${resolution.ip}`) : null;
  if (!resolution.ip && !warnedAboutMissingIp) {
    warnedAboutMissingIp = true;
    console.warn(JSON.stringify({ event: "auth.client_ip_unavailable", source: "rate_limit" }));
  }

  const fingerprint = getRequestFingerprint(request) ?? randomUUID();
  const identity = ipHash ?? hashIdentifier(`fingerprint:${fingerprint}`);
  return {
    pair: hashIdentifier(`ip-email:${identity}:${emailHash}`),
    ip: hashIdentifier(`ip-only:${identity}`),
    email: hashIdentifier(`email-only:${emailHash}`),
    emailHash,
    ipAddress: getClientIp(request),
  };
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

export function setLoginRateLimitStoreForTests(store: LoginRateLimitStore | undefined): void {
  storePromise = store ? Promise.resolve(store) : undefined;
}

export function loginKey(request: Request, email: string): string {
  return keyDetails(request, email).pair;
}

export async function checkLoginLimit(request: Request, email: string): Promise<LoginLimitStatus> {
  const keys = keyDetails(request, email);
  const store = await getStore();
  const checks = await Promise.all([store.peek(keys.pair), store.peek(keys.ip), store.peek(keys.email)]);
  const results = [
    resultForBucket(checks[0] ?? null, LOGIN_LIMITS.ipEmail.limit, LOGIN_LIMITS.ipEmail.windowMs),
    resultForBucket(checks[1] ?? null, LOGIN_LIMITS.ip.limit, LOGIN_LIMITS.ip.windowMs),
    resultForBucket(checks[2] ?? null, LOGIN_LIMITS.email.limit, LOGIN_LIMITS.email.windowMs),
  ];
  const blocked = results.find((result) => !result.allowed);
  const resolution = resolveClientIp(request);
  return {
    ...(blocked ?? { allowed: true, limit: LOGIN_LIMITS.ipEmail.limit, remaining: Math.min(...results.map((result) => result.remaining)), retryAfterSeconds: 0 }),
    retryAfterSeconds: blocked ? Math.max(...results.filter((result) => !result.allowed).map((result) => result.retryAfterSeconds)) : 0,
    clientIpResolved: resolution.ip !== null,
    source: resolution.source,
  };
}

export async function recordFailedLogin(request: Request, email: string): Promise<{ locked: boolean; retryAfterSeconds: number; ipAddress: string | null }> {
  const keys = keyDetails(request, email);
  const store = await getStore();
  const results = await Promise.all([
    store.consume(keys.pair, LOGIN_LIMITS.ipEmail.limit, LOGIN_LIMITS.ipEmail.windowMs, { emailHash: keys.emailHash }),
    store.consume(keys.ip, LOGIN_LIMITS.ip.limit, LOGIN_LIMITS.ip.windowMs),
    store.consume(keys.email, LOGIN_LIMITS.email.limit, LOGIN_LIMITS.email.windowMs, { emailHash: keys.emailHash }),
  ]);
  const locked = results.some((result) => result.allowed && result.remaining === 0);
  return { locked, retryAfterSeconds: Math.max(...results.map((result) => result.retryAfterSeconds)), ipAddress: keys.ipAddress };
}

export async function resetLoginLimit(request: Request, email: string): Promise<void> {
  const keys = keyDetails(request, email);
  const store = await getStore();
  await Promise.all([store.reset(keys.pair), store.reset(keys.ip), store.resetEmail(keys.emailHash)]);
}

export async function clearLoginLockout(email: string): Promise<void> {
  const store = await getStore();
  await store.resetEmail(hashIdentifier(`email:${normalizedEmail(email)}`));
}

export async function clearAllLoginLockouts(): Promise<void> {
  const store = await getStore();
  await store.resetAll();
}

export async function activeLoginLockouts(email: string) {
  const store = await getStore();
  return store.activeForEmail(hashIdentifier(`email:${normalizedEmail(email)}`));
}

export async function loginRateLimitHealth(request: Request): Promise<{ store: RateLimitStoreName; limits: typeof LOGIN_LIMITS; clientIpResolved: boolean; clientIpSource: ReturnType<typeof resolveClientIp>["source"] }> {
  const store = await getStore();
  const resolution = resolveClientIp(request);
  return { store: store.name, limits: LOGIN_LIMITS, clientIpResolved: resolution.ip !== null, clientIpSource: resolution.source };
}

export function hashLoginEmail(email: string): string {
  return hashIdentifier(`email:${normalizedEmail(email)}`);
}

export function maskEmail(email: string): string {
  const [local, domain] = normalizedEmail(email).split("@");
  if (!local || !domain) return "hidden account";
  return `${local.slice(0, 1)}${"*".repeat(Math.min(5, Math.max(2, local.length - 1)))}@${domain}`;
}

export function hashIpForLogin(ip: string | null): string | null {
  return ip ? createHash("sha256").update(`${getRequiredSecret("IP_HASH_SECRET")}:${ip}`).digest("hex") : null;
}
