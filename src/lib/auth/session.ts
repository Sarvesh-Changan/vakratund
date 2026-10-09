import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { Role } from "@/generated/prisma/enums";
import { auth, isAuthConfigured } from "@/lib/auth/auth";
import { AuthHttpError } from "@/lib/auth/errors";
import { can, isRole, type Permission } from "@/lib/auth/permissions";

export type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
export type AuthMode = "page" | "api";
export type AuthOptions = { mode?: AuthMode };

export async function getSession(): Promise<AuthSession | null> {
  if (!isAuthConfigured()) throw new Error("Authentication is not configured.");
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isRole(session.user.role) || session.user.isActive !== true) return null;
  return session;
}

export async function requireSession(options: AuthOptions = {}): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    if (options.mode === "api") throw new AuthHttpError(401, "Authentication required.");
    redirect("/admin/login");
  }
  return session;
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
