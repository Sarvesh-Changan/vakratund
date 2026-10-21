import "server-only";

import { cookies } from "next/headers";

import { prisma } from "@/lib/db/client";
import { getEnv } from "@/lib/env";
import { logActivity } from "@/server/services/activity";
import { sessionRemaining, sessionTimeoutReason, type SessionRecord, type SessionRemaining, type SessionTimeoutConfig, type SessionTimeoutReason } from "@/lib/auth/session-timeout-policy";

export { sessionRemaining, sessionTimeoutReason } from "@/lib/auth/session-timeout-policy";
export type { SessionRecord, SessionRemaining, SessionTimeoutConfig, SessionTimeoutReason } from "@/lib/auth/session-timeout-policy";

export const SESSION_TOUCH_THROTTLE_MS = 60 * 1000;

export type SessionActivityMode = "active" | "passive" | "none";
export function sessionTimeoutConfig(): SessionTimeoutConfig {
  const environment = getEnv();
  return {
    idleTimeoutMs: environment.ADMIN_IDLE_TIMEOUT_MINUTES * 60 * 1000,
    warningMs: environment.ADMIN_IDLE_WARNING_MINUTES * 60 * 1000,
    absoluteTimeoutMs: environment.ADMIN_SESSION_MAX_HOURS * 60 * 60 * 1000,
  };
}

export async function findSessionRecord(sessionId: string): Promise<SessionRecord | null> {
  return prisma.session.findUnique({
    where: { id: sessionId },
    select: { id: true, userId: true, createdAt: true, expiresAt: true, lastActivityAt: true },
  });
}

export async function touchSession(sessionId: string, now = Date.now()): Promise<boolean> {
  const updated = await prisma.session.updateMany({
    where: { id: sessionId, lastActivityAt: { lt: new Date(now - SESSION_TOUCH_THROTTLE_MS) } },
    data: { lastActivityAt: new Date(now) },
  });
  return updated.count > 0;
}

export async function extendSession(sessionId: string, now = Date.now()): Promise<SessionRemaining | null> {
  const record = await findSessionRecord(sessionId);
  if (!record) return null;
  const reason = sessionTimeoutReason(record, now, sessionTimeoutConfig());
  if (reason) {
    await revokeExpiredSession(record, reason);
    return null;
  }
  const updated = await prisma.session.update({ where: { id: sessionId }, data: { lastActivityAt: new Date(now) }, select: { id: true, userId: true, createdAt: true, expiresAt: true, lastActivityAt: true } });
  return sessionRemaining(updated, now, sessionTimeoutConfig());
}

export async function revokeExpiredSession(record: SessionRecord, reason: SessionTimeoutReason): Promise<boolean> {
  const deleted = await prisma.session.deleteMany({ where: { id: record.id } });
  if (deleted.count > 0) {
    try {
      await logActivity({ userId: record.userId, action: "auth.idle_logout", entityType: "Auth", entityId: record.id, summary: reason === "absolute" ? "Session ended at its absolute lifetime" : "Session ended after inactivity" });
    } catch {
      console.error(JSON.stringify({ event: "auth.idle_logout_audit_failed" }));
    }
  }
  return deleted.count > 0;
}

export async function clearAuthSessionCookies(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("better-auth.session_token");
    cookieStore.delete("__Secure-better-auth.session_token");
  } catch {
    // Server Components cannot always mutate cookies; route/action responses clear them.
  }
}
