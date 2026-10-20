"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button, FormField, Input, fieldDescribedBy } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (retryAfterSeconds === null) return;
    const timer = window.setInterval(() => setRetryAfterSeconds((value) => {
      if (value === null) return null;
      const next = Math.max(0, value - 1);
      if (next === 0) setError(null);
      return next;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [retryAfterSeconds]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
          const seconds = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.ceil(retryAfter) : 60;
          setRetryAfterSeconds(seconds);
          setError(`Too many attempts. Try again in about ${Math.max(1, Math.ceil(seconds / 60))} minutes.`);
          return;
        }
        setError("Invalid email or password");
        return;
      }
      setRetryAfterSeconds(null);
      const body: unknown = await response.json();
      const mustChangePassword = typeof body === "object" && body !== null && "user" in body && typeof body.user === "object" && body.user !== null && "mustChangePassword" in body.user && body.user.mustChangePassword === true;
      router.replace(mustChangePassword ? "/admin/change-password" : "/admin");
      router.refresh();
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  const describedBy = fieldDescribedBy("admin-email", error ?? undefined);
  return (
    <form className="space-y-5" onSubmit={submit} noValidate>
      <FormField label="Email" htmlFor="admin-email" required error={error ?? undefined}>
        <Input id="admin-email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required aria-describedby={describedBy} />
      </FormField>
      <FormField label="Password" htmlFor="admin-password" required>
        <Input id="admin-password" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
      </FormField>
      {retryAfterSeconds !== null && retryAfterSeconds > 0 ? <p className="text-center text-sm text-ink-muted" aria-live="polite">Try again in {retryAfterSeconds}s.</p> : null}
      <Button type="submit" className="w-full" loading={loading} disabled={retryAfterSeconds !== null && retryAfterSeconds > 0}>Sign in</Button>
      <p className="text-center text-sm"><Link className="text-brand-deep underline-offset-4 hover:underline" href="/admin/forgot-password">Forgot password?</Link></p>
    </form>
  );
}
