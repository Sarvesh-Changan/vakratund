export type SessionTimeoutReason = "idle" | "absolute" | "expired";
export type SessionTimeoutConfig = { idleTimeoutMs: number; warningMs: number; absoluteTimeoutMs: number };
export type SessionRecord = { id: string; userId: string; createdAt: Date; expiresAt: Date; lastActivityAt: Date };
export type SessionRemaining = { idleRemainingSeconds: number; absoluteRemainingSeconds: number };

export function sessionTimeoutReason(record: SessionRecord, now = Date.now(), config: SessionTimeoutConfig): SessionTimeoutReason | null {
  if (record.expiresAt.getTime() <= now) return "expired";
  if (now - record.createdAt.getTime() >= config.absoluteTimeoutMs) return "absolute";
  if (now - record.lastActivityAt.getTime() >= config.idleTimeoutMs) return "idle";
  return null;
}

export function sessionRemaining(record: SessionRecord, now = Date.now(), config: SessionTimeoutConfig): SessionRemaining {
  const idleRemaining = Math.max(0, config.idleTimeoutMs - (now - record.lastActivityAt.getTime()));
  const absoluteRemaining = Math.max(0, config.absoluteTimeoutMs - (now - record.createdAt.getTime()));
  return { idleRemainingSeconds: Math.floor(idleRemaining / 1000), absoluteRemainingSeconds: Math.floor(absoluteRemaining / 1000) };
}
