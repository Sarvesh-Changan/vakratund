"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { notifyAdminLogout } from "@/components/admin/admin-session-events";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function logout() {
    setLoading(true);
    setError(false);

    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        credentials: "same-origin",
      });

      if (!response.ok) {
        setError(true);
        return;
      }

      notifyAdminLogout();
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return <div className="flex flex-col items-end gap-1"><Button type="button" variant="ghost" size="sm" loading={loading} onClick={logout}>Log out</Button>{error ? <span role="alert" className="text-xs text-danger">Could not log out. Try again.</span> : null}</div>;
}
