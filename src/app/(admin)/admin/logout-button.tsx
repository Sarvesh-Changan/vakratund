"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/auth/sign-out", { method: "POST", credentials: "same-origin" });
    router.push("/admin/login");
  }

  return <Button type="button" variant="ghost" size="sm" loading={loading} onClick={logout}>Log out</Button>;
}
