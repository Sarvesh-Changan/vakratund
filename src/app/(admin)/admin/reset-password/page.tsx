import type { Metadata } from "next";

import { ResetPasswordForm } from "@/app/(admin)/admin/reset-password/reset-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : undefined;
  return <div className="flex min-h-screen items-center justify-center px-4 py-12"><div className="w-full max-w-md space-y-8"><div><h1 className="font-heading text-3xl font-semibold">Choose a new password</h1><p className="mt-2 text-ink-muted">Reset links are single-use and expire automatically.</p></div><ResetPasswordForm token={token} /></div></div>;
}
