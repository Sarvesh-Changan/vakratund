import "server-only";

import { getEnv } from "@/lib/env";
import { type LoginRateLimitStore, type RateLimitBucket, type RateLimitConsumeOptions } from "@/lib/rate-limit/store";
import type { RateLimitResult } from "@/lib/rate-limit/limiter";

type UpstashResult = { result?: unknown; error?: string };
type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const CONSUME_SCRIPT = `local raw=redis.call('GET',KEYS[1]); local now=tonumber(ARGV[1]); local window=tonumber(ARGV[2]); local limit=tonumber(ARGV[3]); local state=raw and cjson.decode(raw) or {count=0,windowStart=now,windowMs=window}; if now-state.windowStart>=window then state={count=0,windowStart=now,windowMs=window}; end; if state.count>=limit then return {0,state.count,state.windowStart+window-now}; end; state.count=state.count+1; if state.count>=limit then state.lockedUntil=state.windowStart+window; else state.lockedUntil=cjson.null; end; redis.call('SET',KEYS[1],cjson.encode(state),'PX',window); return {1,state.count,state.windowStart+window-now};`;

export class UpstashLoginRateLimitStore implements LoginRateLimitStore {
  readonly name = "upstash" as const;
  private readonly url: string;
  private readonly token: string;
  private readonly fetcher: FetchLike;

  constructor(url = getEnv().UPSTASH_REDIS_REST_URL ?? "", token = getEnv().UPSTASH_REDIS_REST_TOKEN ?? "", fetcher: FetchLike = fetch) {
    this.url = url.replace(/\/$/, "");
    this.token = token;
    this.fetcher = fetcher;
  }

  private async command(command: unknown[]): Promise<unknown> {
    const response = await this.fetcher(this.url, { method: "POST", headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" }, body: JSON.stringify(command) });
    const body = await response.json() as UpstashResult;
    if (!response.ok || body.error) throw new Error("Rate-limit store unavailable.");
    return body.result;
  }

  private key(keyHash: string): string { return `vakratund:rate-limit:${keyHash}`; }
  private emailSet(emailHash: string): string { return `vakratund:rate-limit:email:${emailHash}`; }

  async peek(keyHash: string): Promise<RateLimitBucket | null> {
    const value = await this.command(["get", this.key(keyHash)]);
    if (typeof value !== "string") return null;
    const parsed: unknown = JSON.parse(value);
    if (!isRedisState(parsed)) return null;
    const now = Date.now();
    return { keyHash, emailHash: null, count: parsed.count, windowStart: parsed.windowStart, lockedUntil: parsed.lockedUntil ?? null, updatedAt: now };
  }

  async consume(keyHash: string, limit: number, windowMs: number, options: RateLimitConsumeOptions = {}): Promise<RateLimitResult> {
    const now = Date.now();
    const result = await this.command(["eval", CONSUME_SCRIPT, "1", this.key(keyHash), String(now), String(windowMs), String(limit)]);
    if (!Array.isArray(result) || result.length < 3 || typeof result[0] !== "number" || typeof result[1] !== "number" || typeof result[2] !== "number") throw new Error("Rate-limit store returned an invalid result.");
    if (options.emailHash) await this.command(["sadd", this.emailSet(options.emailHash), this.key(keyHash)]);
    const count = result[1];
    const retryMs = Math.max(0, result[2]);
    return { allowed: result[0] === 1, limit, remaining: Math.max(0, limit - count), retryAfterSeconds: Math.max(1, Math.ceil(retryMs / 1000)) };
  }

  async reset(keyHash: string): Promise<void> {
    await this.command(["del", this.key(keyHash)]);
  }

  async resetEmail(emailHash: string): Promise<void> {
    const members = await this.command(["smembers", this.emailSet(emailHash)]);
    if (Array.isArray(members) && members.every((member): member is string => typeof member === "string") && members.length > 0) await this.command(["del", ...members]);
    await this.command(["del", this.emailSet(emailHash)]);
  }

  async resetAll(): Promise<void> {
    let cursor = "0";
    do {
      const result = await this.command(["scan", cursor, "match", "vakratund:rate-limit:*", "count", "1000"]);
      if (!Array.isArray(result) || result.length < 2 || typeof result[0] !== "string" || !Array.isArray(result[1])) throw new Error("Rate-limit store returned an invalid scan result.");
      cursor = result[0];
      const keys = result[1].filter((key): key is string => typeof key === "string");
      if (keys.length > 0) await this.command(["del", ...keys]);
    } while (cursor !== "0");
  }

  async activeForEmail(emailHash: string): Promise<RateLimitBucket[]> {
    const members = await this.command(["smembers", this.emailSet(emailHash)]);
    if (!Array.isArray(members)) return [];
    const buckets: RateLimitBucket[] = [];
    for (const member of members) {
      if (typeof member !== "string") continue;
      const keyHash = member.replace(`vakratund:rate-limit:`, "");
      const bucket = await this.peek(keyHash);
      if (bucket && (bucket.lockedUntil ?? 0) > Date.now()) buckets.push({ ...bucket, emailHash });
    }
    return buckets;
  }
}

function isRedisState(value: unknown): value is { count: number; windowStart: number; windowMs: number; lockedUntil?: number } {
  return typeof value === "object" && value !== null && "count" in value && typeof value.count === "number" && "windowStart" in value && typeof value.windowStart === "number" && "windowMs" in value && typeof value.windowMs === "number";
}

