"use client";

import { useState } from "react";

import { revokeOtherSessionsAction } from "@/app/(admin)/admin/(protected)/session-actions";
import { Button } from "@/components/ui";
import { signalAdminActivity } from "./admin-session-events";

export function SignOutOtherDevicesButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function revoke(): Promise<void> {
    setLoading(true);
    signalAdminActivity();
    const result = await revokeOtherSessionsAction();
    setMessage(result.ok ? `${result.count} other session${result.count === 1 ? "" : "s"} ended.` : result.error);
    setLoading(false);
  }
  return <div className="mt-3 border-t pt-3"><Button type="button" variant="secondary" size="sm" loading={loading} onClick={() => void revoke()}>Sign out other devices</Button>{message ? <p role="status" className="mt-2 text-xs text-ink-muted">{message}</p> : null}</div>;
}
