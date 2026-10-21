import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { Role } from "@/generated/prisma/enums";
import { auth, isAuthConfigured } from "@/lib/auth/auth";
import { AuthHttpError } from "@/lib/auth/errors";
import { can, isRole, type Permission } from "@/lib/auth/permissions";
import { clearAuthSessionCookies, findSessionRecord, revokeExpiredSession, sessionTimeoutConfig, sessionTimeoutReason, touchSession, type SessionActivityMode } from "@/lib/auth/session-timeout";

export type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
export type AuthMode = "page" | "api";
export type AuthOptions = { mode?: AuthMode; activity?: SessionActivityMode };
export type SessionValidation = { session: AuthSession | null; expired: boolean };

function timeoutLoginPath(requestHeaders: Headers): string {
  const nextPath = requestHeaders.get("x-admin-request-path");
  if (nextPath && nextPath.startsWith("/admin/") && !nextPath.startsWith("/admin/login")) {
    return `/admin/login?reason=timeout&next=${encodeURIComponent(nextPath)}`;
  }
  return "/admin/login?reason=timeout";
}

export async function validateSessionHeaders(requestHeaders: Headers, activity: SessionActivityMode = "active"): Promise<SessionValidation> {
  if (!isAuthConfigured()) throw new Error("Authentication is not configured.");
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session || !isRole(session.user.role) || session.user.isActive !== true) return { session: null, expired: false };
  const record = await findSessionRecord(session.session.id);
  if (!record) return { session: null, expired: false };
  const reason = sessionTimeoutReason(record, Date.now(), sessionTimeoutConfig());
  if (reason) {
    await revokeExpiredSession(record, reason);
    return { session: null, expired: true };
  }
  if (activity === "active") await touchSession(record.id);
  return { session, expired: false };
}

async function loadSession(options: AuthOptions = {}): Promise<SessionValidation> {
  const result = await validateSessionHeaders(await headers(), options.activity ?? "active");
  if (result.expired) await clearAuthSessionCookies();
  return result;
}

export async function getSession(options: AuthOptions = {}): Promise<AuthSession | null> {
  return (await loadSession(options)).session;
}

export async function requireSession(options: AuthOptions = {}): Promise<AuthSession> {
  const result = await loadSession(options);
  if (!result.session) {
    const requestHeaders = await headers();
    const isServerAction = requestHeaders.has("next-action");
    if (options.mode === "api" || isServerAction) {
      throw new AuthHttpError(401, result.expired ? "Session expired." : "Authentication required.", result.expired ? "SESSION_EXPIRED" : "AUTHENTICATION_REQUIRED");
    }
    redirect(result.expired ? timeoutLoginPath(requestHeaders) : "/admin/login");
  }
  return result.session;
}

export async function requireRole(...roles: Role[]): Promise<AuthSession> {
  const session = await requireSession();
  if (!isRole(session.user.role) || !roles.includes(session.user.role)) throw new AuthHttpError(403, "Forbidden.");
  return session;
}

export async function requireApiRole(...roles: Role[]): Promise<AuthSession> {
  const session = await requireSession({ mode: "api" });
  if (!isRole(session.user.role) || !roles.includes(session.user.role)) throw new AuthHttpError(403, "Forbidden.");
  return session;
}

export async function requirePermission(permission: Permission, options: AuthOptions = {}): Promise<AuthSession> {
  const session = await requireSession(options);
  if (!isRole(session.user.role) || !can(session.user.role, permission)) throw new AuthHttpError(403, "Forbidden.");
  return session;
}
