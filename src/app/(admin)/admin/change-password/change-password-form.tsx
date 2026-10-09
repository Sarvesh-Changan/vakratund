"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, FormField, Input } from "@/components/ui";

export function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmation) { setError("Passwords do not match."); return; }
    if (newPassword.length < 12) { setError("Password must be at least 12 characters."); return; }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ currentPassword, newPassword, revokeOtherSessions: true }) });
      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        if (typeof body === "object" && body !== null && "code" in body && body.code === "PASSWORD_CHANGE_FINALIZATION_FAILED") {
          setError("Your password was changed, but account setup could not be completed. Sign in with your new password and try again, or contact an administrator.");
          return;
        }
        throw new Error("change-failed");
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("We could not change your password. Check your current password and try again.");
    } finally { setLoading(false); }
  }

  return <form className="space-y-5" onSubmit={submit} noValidate><FormField label="Current password" htmlFor="current-password" required><Input id="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required /></FormField><FormField label="New password" htmlFor="change-new-password" required error={error ?? undefined}><Input id="change-new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={12} required /></FormField><FormField label="Confirm new password" htmlFor="change-confirm-password" required><Input id="change-confirm-password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" minLength={12} required /></FormField><Button type="submit" loading={loading} className="w-full">Change password</Button></form>;
}
