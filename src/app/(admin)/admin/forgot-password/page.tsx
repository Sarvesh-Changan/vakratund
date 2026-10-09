import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/app/(admin)/admin/forgot-password/forgot-password-form";

export const metadata: Metadata = { title: "Reset admin password" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8"><div><h1 className="font-heading text-3xl font-semibold">Reset your password</h1><p className="mt-2 text-ink-muted">Enter your work email and we’ll send a reset link if the account exists.</p></div><ForgotPasswordForm /></div>
    </div>
  );
}
