import { createHash } from "node:crypto";

import { getRequiredSecret } from "@/lib/env";
import { InMemoryRateLimiter } from "@/lib/rate-limit/limiter";

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const limiter = new InMemoryRateLimiter();
function firstForwardedValue(value: string | null): string {
  return value?.split(",")[0]?.trim() || "unknown-ip";
}

export function loginKey(request: Request, email: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? firstForwardedValue(forwarded) : request.headers.get("x-real-ip")?.trim() || "unknown-ip";
  const rateLimitSalt = getRequiredSecret("BETTER_AUTH_SECRET");
  return createHash("sha256").update(`${rateLimitSalt}:${ip}:${email.trim().toLowerCase()}`).digest("hex");
}

export function checkLoginLimit(request: Request, email: string) {
  return limiter.check(loginKey(request, email), LOGIN_LIMIT, LOGIN_WINDOW_MS);
}

export function resetLoginLimit(request: Request, email: string): void {
  limiter.reset(loginKey(request, email));
}
