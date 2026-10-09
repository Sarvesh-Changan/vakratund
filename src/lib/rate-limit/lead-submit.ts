import { createHash } from "node:crypto";

import { getRequiredSecret } from "@/lib/env";
import { InMemoryRateLimiter, type RateLimitResult } from "@/lib/rate-limit/limiter";

const limiter = new InMemoryRateLimiter();
const WINDOW_MS = 10 * 60 * 1000;
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;
const SHORT_LIMIT = 5;
const DAILY_LIMIT = 20;

export function requestIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip")?.trim() || "unknown-ip";
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(`${getRequiredSecret("IP_HASH_SECRET")}:${ip}`).digest("hex");
}

function hashPhone(phone: string): string {
  return createHash("sha256").update(`${getRequiredSecret("IP_HASH_SECRET")}:phone:${phone}`).digest("hex");
}

export function checkLeadSubmitLimit(ipHash: string, phone: string): RateLimitResult {
  const checks = [
    limiter.check(`lead-submit:ip:${ipHash}`, SHORT_LIMIT, WINDOW_MS),
    limiter.check(`lead-submit:phone:${hashPhone(phone)}`, SHORT_LIMIT, WINDOW_MS),
    limiter.check(`lead-submit:daily:${ipHash}`, DAILY_LIMIT, DAILY_WINDOW_MS),
  ];
  const blocked = checks.find((check) => !check.allowed);
  return blocked ?? { allowed: true, limit: SHORT_LIMIT, remaining: Math.min(...checks.map((check) => check.remaining)), retryAfterSeconds: Math.max(...checks.map((check) => check.retryAfterSeconds)) };
}
