export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  check(key: string, limit: number, windowMs: number): RateLimitResult;
  reset(key: string): void;
}

type Bucket = { count: number; resetAt: number };

export class InMemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  check(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const current = this.buckets.get(key);
    const bucket = current && current.resetAt > now ? current : { count: 0, resetAt: now + windowMs };
    bucket.count += 1;
    this.buckets.set(key, bucket);

    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return {
      allowed: bucket.count <= limit,
      limit,
      remaining: Math.max(0, limit - bucket.count),
      retryAfterSeconds,
    };
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }
}
