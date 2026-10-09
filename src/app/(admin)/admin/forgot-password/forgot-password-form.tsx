"use client";

import Link from "next/link";
import { useState } from "react";

import { Button, FormField, Input } from "@/components/ui";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, redirectTo: `${window.location.origin}/admin/reset-password` }),
      });
      if (!response.ok) throw new Error("request-failed");
      setSubmitted(true);
    } catch {
      setError("We could not process that request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) return <div className="space-y-4 rounded-card border bg-surface p-6" role="status"><p>If the address is registered, a password reset link has been sent.</p><Link className="text-brand-deep underline-offset-4 hover:underline" href="/admin/login">Return to sign in</Link></div>;

  return <form className="space-y-5" onSubmit={submit} noValidate><FormField label="Email" htmlFor="reset-email" required error={error ?? undefined}><Input id="reset-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></FormField><Button type="submit" loading={loading} className="w-full">Send reset link</Button><p className="text-center text-sm"><Link className="text-brand-deep underline-offset-4 hover:underline" href="/admin/login">Back to sign in</Link></p></form>;
}
