import type { Metadata } from "next";

import { ChangePasswordForm } from "@/app/(admin)/admin/change-password/change-password-form";
import { requireSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Change password" };

export default async function ChangePasswordPage() {
  const session = await requireSession();
  return <div className="flex min-h-screen items-center justify-center px-4 py-12"><div className="w-full max-w-md space-y-8"><div><h1 className="font-heading text-3xl font-semibold">{session.user.mustChangePassword ? "Set your new password" : "Change password"}</h1><p className="mt-2 text-ink-muted">Use at least 12 characters. All existing sessions will be revoked.</p></div><ChangePasswordForm /></div></div>;
}
