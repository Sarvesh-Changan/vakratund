import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { LoginForm } from "@/app/(admin)/admin/login/login-form";
import { BrandLogo } from "@/components/brand-logo";
import { getEnv } from "@/lib/env";

export const metadata: Metadata = { title: "Admin login" };

function safeAdminNext(value: string | string[] | undefined): string | undefined {
  if (typeof value !== "string" || !value.startsWith("/admin") || value.startsWith("//") || value.startsWith("/admin/login")) return undefined;
  return value;
}

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ reason?: string | string[]; next?: string | string[] }> }) {
  const session = await getSession({ activity: "none" });
  if (session) redirect(session.user.mustChangePassword ? "/admin/change-password" : "/admin");
  const params = await searchParams;
  const nextPath = safeAdminNext(params.next);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div><BrandLogo width={64} height={64} priority className="size-16" /><p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-brand-deep">Vakratund Construction</p><h1 className="mt-2 font-heading text-3xl font-semibold">Admin sign in</h1><p className="mt-2 text-ink-muted">Use your authorized account to continue.</p></div>
        <LoginForm nextPath={nextPath} timedOut={params.reason === "timeout"} idleTimeoutMinutes={getEnv().ADMIN_IDLE_TIMEOUT_MINUTES} />
      </div>
    </div>
  );
}
