import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { LoginForm } from "@/app/(admin)/admin/login/login-form";

export const metadata: Metadata = { title: "Admin login" };

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session) redirect(session.user.mustChangePassword ? "/admin/change-password" : "/admin");

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div><p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-brand-deep">Vakratund Construction</p><h1 className="font-heading text-3xl font-semibold">Admin sign in</h1><p className="mt-2 text-ink-muted">Use your authorized account to continue.</p></div>
        <LoginForm />
      </div>
    </div>
  );
}
