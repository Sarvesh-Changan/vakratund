import type { RateLimitResult } from "@/lib/rate-limit/limiter";

export type RateLimitBucket = {
  keyHash: string;
  emailHash: string | null;
  count: number;
  windowStart: number;
  lockedUntil: number | null;
  updatedAt: number;
};

export type RateLimitStoreName = "memory" | "upstash" | "database";

export type RateLimitConsumeOptions = {
  emailHash?: string;
};

export interface LoginRateLimitStore {
  readonly name: RateLimitStoreName;
  peek(keyHash: string): Promise<RateLimitBucket | null>;
  consume(keyHash: string, limit: number, windowMs: number, options?: RateLimitConsumeOptions): Promise<RateLimitResult>;
  reset(keyHash: string): Promise<void>;
  resetEmail(emailHash: string): Promise<void>;
  resetAll(): Promise<void>;
  activeForEmail(emailHash: string): Promise<RateLimitBucket[]>;
}

export function resultForBucket(bucket: RateLimitBucket | null, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  if (!bucket || bucket.windowStart + windowMs <= now) {
    return { allowed: true, limit, remaining: limit, retryAfterSeconds: 0 };
  }

  const lockedUntil = bucket.lockedUntil ?? (bucket.count >= limit ? bucket.windowStart + windowMs : null);
  const blocked = lockedUntil !== null && lockedUntil > now;
  return {
    allowed: !blocked,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: blocked ? Math.max(1, Math.ceil((lockedUntil - now) / 1000)) : Math.max(1, Math.ceil((bucket.windowStart + windowMs - now) / 1000)),
  };
}

export class InMemoryLoginRateLimitStore implements LoginRateLimitStore {
  readonly name = "memory" as const;
  private readonly buckets = new Map<string, RateLimitBucket>();

  async peek(keyHash: string): Promise<RateLimitBucket | null> {
    const bucket = this.buckets.get(keyHash);
    if (!bucket || bucket.windowStart <= Date.now() - 60 * 60 * 1000) return null;
    return { ...bucket };
  }

  async consume(keyHash: string, limit: number, windowMs: number, options: RateLimitConsumeOptions = {}): Promise<RateLimitResult> {
    const now = Date.now();
    const current = this.buckets.get(keyHash);
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const bucket = current?.windowStart === windowStart
      ? { ...current }
      : { keyHash, emailHash: options.emailHash ?? null, count: 0, windowStart, lockedUntil: null, updatedAt: now };

    if (bucket.count >= limit) return resultForBucket(bucket, limit, windowMs, now);
    bucket.count += 1;
    bucket.updatedAt = now;
    bucket.emailHash = bucket.emailHash ?? options.emailHash ?? null;
    if (bucket.count >= limit) bucket.lockedUntil = bucket.windowStart + windowMs;
    this.buckets.set(keyHash, bucket);
    return { allowed: true, limit, remaining: Math.max(0, limit - bucket.count), retryAfterSeconds: Math.max(1, Math.ceil((bucket.windowStart + windowMs - now) / 1000)) };
  }

  async reset(keyHash: string): Promise<void> {
    this.buckets.delete(keyHash);
  }

  async resetEmail(emailHash: string): Promise<void> {
    for (const [key, bucket] of this.buckets) if (bucket.emailHash === emailHash) this.buckets.delete(key);
  }

  async resetAll(): Promise<void> {
    this.buckets.clear();
  }

  async activeForEmail(emailHash: string): Promise<RateLimitBucket[]> {
    const now = Date.now();
    return [...this.buckets.values()].filter((bucket) => bucket.emailHash === emailHash && (bucket.lockedUntil ?? 0) > now).map((bucket) => ({ ...bucket }));
  }
}
