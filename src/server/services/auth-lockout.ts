import "server-only";

import { getEnv } from "@/lib/env";
import { maskEmail } from "@/lib/rate-limit/login";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/db/client";

export async function findLockedAccount(email: string): Promise<{ id: string; maskedEmail: string } | null> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true, email: true } });
  return user ? { id: user.id, maskedEmail: maskEmail(user.email) } : null;
}

export async function notifySuperAdminsOfLockout(maskedEmail: string): Promise<void> {
  try {
    const recipients = (await prisma.user.findMany({ where: { role: "SUPER_ADMIN", isActive: true }, select: { email: true } })).map((user) => user.email);
    if (recipients.length === 0) return;
    const siteName = getEnv().NEXT_PUBLIC_SITE_URL;
    await sendEmail({
      to: recipients,
      subject: "Security alert: admin account temporarily locked",
      html: `<p>An admin account has been temporarily locked after repeated failed sign-in attempts.</p><p>Account: ${maskedEmail}</p><p>Review the Locked accounts panel in the admin dashboard. ${siteName}</p>`,
      text: `An admin account has been temporarily locked after repeated failed sign-in attempts. Account: ${maskedEmail}. Review the Locked accounts panel in the admin dashboard. ${siteName}`,
      type: "AUTH_LOCKOUT",
    });
  } catch {
    console.error(JSON.stringify({ event: "auth.lockout_notification_failed" }));
  }
}
