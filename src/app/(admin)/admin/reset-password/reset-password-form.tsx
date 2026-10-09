"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, FormField, Input } from "@/components/ui";

export function ResetPasswordForm({ token }: { token?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : "This reset link is invalid or expired.");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    if (password !== confirmation) { setError("Passwords do not match."); return; }
    if (password.length < 12) { setError("Password must be at least 12 characters."); return; }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, newPassword: password }) });
      if (!response.ok) throw new Error("reset-failed");
      router.replace("/admin/login?reset=complete");
    } catch {
      setError("This reset link is invalid or expired.");
    } finally { setLoading(false); }
  }

  return <form className="space-y-5" onSubmit={submit} noValidate><FormField label="New password" htmlFor="new-password" required error={error ?? undefined}><Input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={12} required /></FormField><FormField label="Confirm password" htmlFor="confirm-password" required><Input id="confirm-password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" minLength={12} required /></FormField><Button type="submit" loading={loading} disabled={!token} className="w-full">Set new password</Button><p className="text-center text-sm"><Link className="text-brand-deep underline-offset-4 hover:underline" href="/admin/login">Back to sign in</Link></p></form>;
}
