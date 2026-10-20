import "server-only";

import { prisma } from "@/lib/db/client";
import { resultForBucket, type LoginRateLimitStore, type RateLimitBucket, type RateLimitConsumeOptions } from "@/lib/rate-limit/store";
import type { RateLimitResult } from "@/lib/rate-limit/limiter";

function toBucket(row: { keyHash: string; emailHash: string | null; count: number; windowStart: Date; lockedUntil: Date | null; updatedAt: Date }): RateLimitBucket {
  return { keyHash: row.keyHash, emailHash: row.emailHash, count: row.count, windowStart: row.windowStart.getTime(), lockedUntil: row.lockedUntil?.getTime() ?? null, updatedAt: row.updatedAt.getTime() };
}

let operations = 0;

export class DatabaseLoginRateLimitStore implements LoginRateLimitStore {
  readonly name = "database" as const;

  async peek(keyHash: string): Promise<RateLimitBucket | null> {
    const row = await prisma.rateLimitBucket.findUnique({ where: { keyHash } });
    return row ? toBucket(row) : null;
  }

  async consume(keyHash: string, limit: number, windowMs: number, options: RateLimitConsumeOptions = {}): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStartMs = Math.floor(now / windowMs) * windowMs;
    const windowStart = new Date(windowStartMs);
    const windowEnd = new Date(windowStartMs + windowMs);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const current = await prisma.rateLimitBucket.findUnique({ where: { keyHash } });
      if (current && current.windowStart.getTime() === windowStartMs) {
        if (current.count >= limit) return resultForBucket(toBucket(current), limit, windowMs, now);
        const updated = await prisma.rateLimitBucket.updateMany({
          where: { keyHash, windowStart, count: { lt: limit } },
          data: { count: { increment: 1 }, updatedAt: new Date(now) },
        });
        if (updated.count === 0) continue;
        const row = await prisma.rateLimitBucket.findUnique({ where: { keyHash } });
        if (!row) continue;
        if (row.count >= limit && !row.lockedUntil) {
          await prisma.rateLimitBucket.updateMany({ where: { keyHash, count: { gte: limit } }, data: { lockedUntil: windowEnd, updatedAt: new Date(now) } });
        }
        await cleanupOccasionally();
        return { allowed: true, limit, remaining: Math.max(0, limit - row.count), retryAfterSeconds: Math.max(1, Math.ceil((windowStartMs + windowMs - now) / 1000)) };
      }

      if (current) {
        const replaced = await prisma.rateLimitBucket.updateMany({
          where: { keyHash, windowStart: { lt: windowStart } },
          data: { count: 1, windowStart, lockedUntil: limit <= 1 ? windowEnd : null, updatedAt: new Date(now), emailHash: options.emailHash ?? current.emailHash },
        });
        if (replaced.count === 0) continue;
        await cleanupOccasionally();
        return { allowed: limit >= 1, limit, remaining: Math.max(0, limit - 1), retryAfterSeconds: Math.max(1, Math.ceil(windowMs / 1000)) };
      }

      try {
        const created = await prisma.rateLimitBucket.create({ data: { keyHash, emailHash: options.emailHash ?? null, count: 1, windowStart, lockedUntil: limit <= 1 ? windowEnd : null, updatedAt: new Date(now) } });
        await cleanupOccasionally();
        return { allowed: true, limit, remaining: Math.max(0, limit - created.count), retryAfterSeconds: Math.max(1, Math.ceil((windowStartMs + windowMs - now) / 1000)) };
      } catch {
        // Another request created the unique bucket. Retry against its current count.
      }
    }

    const fallback = await this.peek(keyHash);
    return resultForBucket(fallback, limit, windowMs, now);
  }

  async reset(keyHash: string): Promise<void> {
    await prisma.rateLimitBucket.deleteMany({ where: { keyHash } });
  }

  async resetEmail(emailHash: string): Promise<void> {
    await prisma.rateLimitBucket.deleteMany({ where: { emailHash } });
  }

  async resetAll(): Promise<void> {
    await prisma.rateLimitBucket.deleteMany();
  }

  async activeForEmail(emailHash: string): Promise<RateLimitBucket[]> {
    const rows = await prisma.rateLimitBucket.findMany({ where: { emailHash, lockedUntil: { gt: new Date() } }, orderBy: { lockedUntil: "desc" } });
    return rows.map(toBucket);
  }
}

async function cleanupOccasionally(): Promise<void> {
  operations += 1;
  if (operations % 100 !== 0) return;
  const now = new Date();
  await prisma.rateLimitBucket.deleteMany({ where: { OR: [{ lockedUntil: { lt: now } }, { updatedAt: { lt: new Date(Date.now() - 60 * 60 * 1000) } }] } });
}
