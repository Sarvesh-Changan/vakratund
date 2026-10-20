import "server-only";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import type { Prisma } from "@/generated/prisma/client";
import type { Role } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth/auth";
import { revokeAllSessions, updateUserAccess } from "@/lib/auth/session-security";
import { prisma } from "@/lib/db/client";
import { logActivity } from "@/server/services/activity";
import { activeLoginLockouts, clearLoginLockout, maskEmail } from "@/lib/rate-limit/login";
export type UserView = { id: string; name: string; email: string; role: Role; isActive: boolean; mustChangePassword: boolean; lastLoginAt: string | null; sessionCount: number };
export type UserLockoutView = { userId: string; maskedEmail: string; lockedUntil: string };
const userSelect = { id: true, name: true, email: true, role: true, isActive: true, mustChangePassword: true, lastLoginAt: true, _count: { select: { sessions: true } } } satisfies Prisma.UserSelect;
type UserRecord = Prisma.UserGetPayload<{ select: typeof userSelect }>;
function view(row: UserRecord): UserView { return { ...row, lastLoginAt: row.lastLoginAt?.toISOString() ?? null, sessionCount: row._count.sessions }; }
export async function listUsers(): Promise<UserView[]> { return (await prisma.user.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }], select: userSelect })).map(view); }
export async function createUser(input: { name: string; email: string; temporaryPassword: string; role: Role; mustChangePassword: boolean }, actorId: string): Promise<UserView> {
  const email = input.email.toLowerCase(); const password = await hashPassword(input.temporaryPassword);
  const row = await prisma.$transaction(async (tx) => { const user = await tx.user.create({ data: { name: input.name, email, role: input.role, mustChangePassword: input.mustChangePassword }, select: userSelect }); await tx.account.create({ data: { id: randomUUID(), userId: user.id, accountId: user.id, providerId: "credential", password } }); return user; });
  await logActivity({ userId: actorId, action: "user.create", entityType: "User", entityId: row.id, summary: "Created a staff account", diff: { role: row.role, mustChangePassword: row.mustChangePassword } }); return view(row);
}
export async function updateUser(input: { id: string; name: string; email: string; role: Role; isActive: boolean }, actorId: string): Promise<UserView> { if (!await prisma.user.findUnique({ where: { id: input.id }, select: { id: true } })) throw new Error("User not found."); await updateUserAccess(input.id, input.role, input.isActive); const row = await prisma.user.update({ where: { id: input.id }, data: { name: input.name, email: input.email.toLowerCase() }, select: userSelect }); await logActivity({ userId: actorId, action: "user.update", entityType: "User", entityId: row.id, summary: "Updated staff account", diff: { role: row.role, isActive: row.isActive } }); return view(row); }
export async function revokeUserSessions(id: string, actorId: string): Promise<void> { await revokeAllSessions(id); await logActivity({ userId: actorId, action: "user.sessions.revoke", entityType: "User", entityId: id, summary: "Revoked staff sessions", diff: { revoked: true } }); }
export async function triggerPasswordReset(id: string, actorId: string): Promise<void> { const user = await prisma.user.findUnique({ where: { id }, select: { email: true } }); if (!user) throw new Error("User not found."); await auth.api.requestPasswordReset({ body: { email: user.email, redirectTo: "/admin/reset-password" } }); await revokeAllSessions(id); await logActivity({ userId: actorId, action: "user.password.reset", entityType: "User", entityId: id, summary: "Triggered a password reset", diff: { resetRequested: true } }); }
export async function listActiveLockouts(users: UserView[]): Promise<UserLockoutView[]> {
  const rows = await Promise.all(users.map(async (user) => {
    const lockouts = await activeLoginLockouts(user.email);
    const lockedUntil = lockouts.reduce<number | null>((latest, bucket) => Math.max(latest ?? 0, bucket.lockedUntil ?? 0) || latest, null);
    return lockedUntil ? { userId: user.id, maskedEmail: maskEmail(user.email), lockedUntil: new Date(lockedUntil).toISOString() } : null;
  }));
  return rows.filter((row): row is UserLockoutView => row !== null).sort((a, b) => b.lockedUntil.localeCompare(a.lockedUntil));
}

export async function unlockUserLockout(userId: string, actorId: string, ipAddress: string | null): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) throw new Error("User not found.");
  await clearLoginLockout(user.email);
  await logActivity({ userId: actorId, action: "auth.unlock", entityType: "User", entityId: userId, summary: "Cleared sign-in lockout", diff: { unlocked: true }, ipAddress });
}
