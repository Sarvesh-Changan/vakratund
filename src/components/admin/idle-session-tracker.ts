export type IdleSessionState = "active" | "warning" | "expired";

export function idleSessionState(input: { now: number; lastActivityAt: number; serverIdleDeadlineAt?: number; serverAbsoluteDeadlineAt?: number }, idleTimeoutMs: number, warningMs: number): { state: IdleSessionState; remainingMs: number } {
  const localDeadline = input.lastActivityAt + idleTimeoutMs;
  const deadline = Math.min(localDeadline, input.serverIdleDeadlineAt ?? Number.POSITIVE_INFINITY, input.serverAbsoluteDeadlineAt ?? Number.POSITIVE_INFINITY);
  const remainingMs = Math.max(0, deadline - input.now);
  return { state: remainingMs <= 0 ? "expired" : remainingMs <= warningMs ? "warning" : "active", remainingMs };
}
