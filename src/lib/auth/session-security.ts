import "server-only";

import { hashPassword } from "better-auth/crypto";

import type { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/client";
import { assertPasswordPolicy } from "@/lib/auth/password-policy";
import { assertSuperAdminInvariant } from "@/lib/auth/super-admin-guard";

export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

export async function clearForcedPasswordChange(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { mustChangePassword: false },
  });
}

export async function changeUserPassword(userId: string, password: string): Promise<void> {
  assertPasswordPolicy(password);
  const passwordHash = await hashPassword(password);

  await prisma.$transaction(async (transaction) => {
    const account = await transaction.account.updateMany({
      where: { userId, providerId: "credential", accountId: userId },
      data: { password: passwordHash },
    });

    if (account.count !== 1) {
      throw new Error("Credential account not found.");
    }

    await transaction.user.update({ where: { id: userId }, data: { mustChangePassword: false } });
    await transaction.session.deleteMany({ where: { userId } });
  });
}

export async function updateUserRole(userId: string, role: Role): Promise<void> {
  await updateUserAccess(userId, role);
}

export async function updateUserAccess(userId: string, role: Role, isActive?: boolean): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({ where: { id: userId }, select: { role: true, isActive: true } });
    if (!user) throw new Error("User not found.");

    const activeSuperAdmins = await transaction.user.count({ where: { role: "SUPER_ADMIN", isActive: true } });
    assertSuperAdminInvariant({ activeSuperAdminCount: activeSuperAdmins, currentRole: user.role, currentIsActive: user.isActive, nextRole: role, nextIsActive: isActive ?? user.isActive });

    await transaction.user.update({ where: { id: userId }, data: { role, ...(isActive === undefined ? {} : { isActive }) } });
    await transaction.session.deleteMany({ where: { userId } });
  });
}

export async function deactivateUser(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) throw new Error("User not found.");
  await updateUserAccess(userId, user.role, false);
  return;
  /*
  await prisma.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({ where: { id: userId }, select: { role: true, isActive: true } });
    if (!user) throw new Error("User not found.");

    const activeSuperAdmins = await transaction.user.count({ where: { role: "SUPER_ADMIN", isActive: true } });
    assertSuperAdminInvariant({ activeSuperAdminCount: activeSuperAdmins, currentRole: user.role, currentIsActive: user.isActive, nextRole: user.role, nextIsActive: false });

    await transaction.user.update({ where: { id: userId }, data: { isActive: false } });
    await transaction.session.deleteMany({ where: { userId } });
  });
  */
}
