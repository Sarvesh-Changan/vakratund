import { createHash } from "node:crypto";
import { getRequiredSecret } from "@/lib/env";
import { InMemoryRateLimiter, type RateLimitResult } from "@/lib/rate-limit/limiter";

const limiter = new InMemoryRateLimiter();
const EVENT_LIMIT = 60;
const EVENT_WINDOW_MS = 10 * 60 * 1000;

function requestIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown-ip";
}

export function hashRequestIp(request: Request): string {
  return createHash("sha256").update(`${getRequiredSecret("IP_HASH_SECRET")}:${requestIp(request)}`).digest("hex");
}

export function checkContactEventLimit(request: Request): RateLimitResult {
  const ipHash = hashRequestIp(request);
  return limiter.check(`contact-events:${ipHash}`, EVENT_LIMIT, EVENT_WINDOW_MS);
}
