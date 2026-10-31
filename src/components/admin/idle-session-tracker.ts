export type IdleSessionState = "active" | "warning" | "expired";

export function idleSessionState(input: { now: number; lastActivityAt: number; serverIdleDeadlineAt?: number; serverAbsoluteDeadlineAt?: number }, idleTimeoutMs: number, warningMs: number): { state: IdleSessionState; remainingMs: number } {
  if (input.now <= 0) {
    return { state: "active", remainingMs: idleTimeoutMs };
  }
  const localDeadline = input.lastActivityAt > 0 || input.now < 1_000_000_000 ? input.lastActivityAt + idleTimeoutMs : Number.POSITIVE_INFINITY;
  const deadline = Math.min(localDeadline, input.serverIdleDeadlineAt ?? Number.POSITIVE_INFINITY, input.serverAbsoluteDeadlineAt ?? Number.POSITIVE_INFINITY);
  const remainingMs = Number.isFinite(deadline) ? Math.max(0, deadline - input.now) : idleTimeoutMs;
  return { state: remainingMs <= 0 ? "expired" : remainingMs <= warningMs ? "warning" : "active", remainingMs };
}
