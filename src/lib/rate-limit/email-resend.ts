import { InMemoryRateLimiter, type RateLimitResult } from "@/lib/rate-limit/limiter";

const limiter = new InMemoryRateLimiter();
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;

export function checkEmailResendLimit(actorId: string, leadId: string): RateLimitResult { return limiter.check(`email-resend:${actorId}:${leadId}`, LIMIT, WINDOW_MS); }
