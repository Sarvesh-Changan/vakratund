"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, FormField, Input, fieldDescribedBy } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        setError("Invalid email or password");
        return;
      }
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
      <Button type="submit" className="w-full" loading={loading}>Sign in</Button>
      <p className="text-center text-sm"><Link className="text-brand-deep underline-offset-4 hover:underline" href="/admin/forgot-password">Forgot password?</Link></p>
    </form>
  );
}
