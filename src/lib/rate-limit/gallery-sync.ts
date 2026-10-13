import { InMemoryRateLimiter, type RateLimitResult } from "@/lib/rate-limit/limiter";

const limiter = new InMemoryRateLimiter();
const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 3;

export function checkGallerySyncLimit(userId: string): RateLimitResult {
  return limiter.check(`gallery-sync:${userId}`, LIMIT, WINDOW_MS);
}
