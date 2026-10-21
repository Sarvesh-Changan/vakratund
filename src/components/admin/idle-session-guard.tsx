"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui";
import { ADMIN_ACTIVITY_EVENT, ADMIN_DIRTY_EVENT, ADMIN_LOGOUT_EVENT } from "./admin-session-events";
import { idleSessionState } from "./idle-session-tracker";

const ACTIVITY_KEY_PREFIX = "vakratund:admin:last-activity:";
const START_KEY_PREFIX = "vakratund:admin:session-start:";
const EVENT_KEY = "vakratund:admin:session-event";
const CHANNEL_NAME = "vakratund-admin-session";

type ServerRemaining = { idleRemainingSeconds: number; absoluteRemainingSeconds: number };
type SessionEvent = { type: "activity" | "logout"; at: number };

function readTimestamp(key: string): number | null {
  try { const value = Number(localStorage.getItem(key)); return Number.isFinite(value) && value > 0 ? value : null; } catch { return null; }
}

function writeEvent(event: SessionEvent): void {
  try { localStorage.setItem(EVENT_KEY, JSON.stringify(event)); } catch { /* Storage is an enhancement; server enforcement remains authoritative. */ }
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function IdleSessionGuard({ userId, idleTimeoutSeconds, warningSeconds, absoluteTimeoutSeconds }: { userId: string; idleTimeoutSeconds: number; warningSeconds: number; absoluteTimeoutSeconds: number }) {
  const activityKey = `${ACTIVITY_KEY_PREFIX}${userId}`;
  const startKey = `${START_KEY_PREFIX}${userId}`;
  const channelRef = useRef<BroadcastChannel | null>(null);
  const lastSignalRef = useRef(0);
  const signingOutRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [lastActivityAt, setLastActivityAt] = useState(() => typeof window === "undefined" ? 0 : readTimestamp(activityKey) ?? Date.now());
  const [sessionStartedAt] = useState(() => typeof window === "undefined" ? 0 : readTimestamp(startKey) ?? Date.now());
  const [serverDeadlines, setServerDeadlines] = useState<{ idle?: number; absolute?: number }>({});
  const [now, setNow] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const state = idleSessionState({ now, lastActivityAt, serverIdleDeadlineAt: serverDeadlines.idle, serverAbsoluteDeadlineAt: serverDeadlines.absolute ?? (sessionStartedAt ? sessionStartedAt + absoluteTimeoutSeconds * 1000 : undefined) }, idleTimeoutSeconds * 1000, warningSeconds * 1000);
  const remainingSeconds = Math.ceil(state.remainingMs / 1000);
  const dialogOpen = state.state === "warning";
  const announcement = remainingSeconds === warningSeconds || remainingSeconds === 60 || remainingSeconds === 10 ? `Your session expires in ${formatCountdown(remainingSeconds)}.` : "";

  const publish = useCallback((event: SessionEvent) => {
    writeEvent(event);
    try { channelRef.current?.postMessage(event); } catch { /* BroadcastChannel is optional. */ }
  }, []);

  const forceSignOut = useCallback((reason: "timeout" | "logout") => {
    if (signingOutRef.current) return;
    signingOutRef.current = true;
    const event = { type: "logout" as const, at: Date.now() };
    publish(event);
    try { localStorage.removeItem(activityKey); } catch { /* ignore */ }
    if (reason === "logout") { window.location.replace("/admin/login"); return; }
    void fetch("/api/auth/sign-out", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: "{}" }).finally(() => {
      window.location.replace("/admin/login?reason=timeout");
    });
  }, [activityKey, publish]);

  const syncServer = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/session/status", { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) { if (response.status === 401) forceSignOut("timeout"); return; }
      const remaining = await response.json() as Partial<ServerRemaining>;
      if (typeof remaining.idleRemainingSeconds !== "number" || typeof remaining.absoluteRemainingSeconds !== "number") return;
      const current = Date.now();
      setServerDeadlines({ idle: current + remaining.idleRemainingSeconds * 1000, absolute: current + remaining.absoluteRemainingSeconds * 1000 });
    } catch { /* A failed status probe does not end a session; each protected request is server-enforced. */ }
  }, [forceSignOut]);

  const recordActivity = useCallback(() => {
    if (dialogOpen || signingOutRef.current) return;
    const current = Date.now();
    if (current - lastSignalRef.current < 1000) return;
    lastSignalRef.current = current;
    setLastActivityAt(current);
    try { localStorage.setItem(activityKey, String(current)); } catch { /* ignore */ }
    publish({ type: "activity", at: current });
  }, [activityKey, dialogOpen, publish]);

  const extend = useCallback(async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/session/extend", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: "{}" });
      if (!response.ok) { if (response.status === 401) forceSignOut("timeout"); return; }
      const remaining = await response.json() as ServerRemaining;
      const current = Date.now();
      setLastActivityAt(current);
      setServerDeadlines({ idle: current + remaining.idleRemainingSeconds * 1000, absolute: current + remaining.absoluteRemainingSeconds * 1000 });
      try { localStorage.setItem(activityKey, String(current)); } catch { /* ignore */ }
      publish({ type: "activity", at: current });
    } finally { setSaving(false); }
  }, [activityKey, forceSignOut, publish]);

  useEffect(() => {
    const started = sessionStartedAt || Date.now();
    try { localStorage.setItem(startKey, String(started)); } catch { /* ignore */ }
    const initialSync = window.setTimeout(() => void syncServer(), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    const refresh = () => { setNow(Date.now()); void syncServer(); };
    const activityEvents = ["pointerdown", "keydown", "click", "scroll", "touchstart", "focus"];
    activityEvents.forEach((event) => window.addEventListener(event, recordActivity, { passive: true }));
    window.addEventListener("pageshow", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener(ADMIN_ACTIVITY_EVENT, recordActivity);
    const onDirty = (event: Event) => setDirty((event as CustomEvent<{ dirty?: boolean }>).detail?.dirty === true);
    const onLogout = () => forceSignOut("logout");
    window.addEventListener(ADMIN_DIRTY_EVENT, onDirty);
    window.addEventListener(ADMIN_LOGOUT_EVENT, onLogout);
    const onStorage = (event: StorageEvent) => { if (event.key === activityKey && event.newValue) setLastActivityAt((value) => Math.max(value, Number(event.newValue) || 0)); if (event.key === EVENT_KEY && event.newValue) { try { const message = JSON.parse(event.newValue) as SessionEvent; if (message.type === "logout") forceSignOut("logout"); if (message.type === "activity") setLastActivityAt((value) => Math.max(value, message.at)); } catch { /* ignore malformed cross-tab messages */ } } };
    window.addEventListener("storage", onStorage);
    let channel: BroadcastChannel | null = null;
    try { channel = new BroadcastChannel(CHANNEL_NAME); channelRef.current = channel; channel.onmessage = (event: MessageEvent<SessionEvent>) => { if (event.data?.type === "logout") forceSignOut("logout"); if (event.data?.type === "activity") setLastActivityAt((value) => Math.max(value, event.data.at)); }; } catch { channelRef.current = null; }
    return () => { window.clearTimeout(initialSync); window.clearInterval(timer); activityEvents.forEach((event) => window.removeEventListener(event, recordActivity)); window.removeEventListener("pageshow", refresh); window.removeEventListener("focus", refresh); window.removeEventListener(ADMIN_ACTIVITY_EVENT, recordActivity); window.removeEventListener(ADMIN_DIRTY_EVENT, onDirty); window.removeEventListener(ADMIN_LOGOUT_EVENT, onLogout); window.removeEventListener("storage", onStorage); channel?.close(); channelRef.current = null; };
  }, [activityKey, forceSignOut, recordActivity, sessionStartedAt, startKey, syncServer]);

  useEffect(() => {
    if (state.state === "expired") forceSignOut("timeout");
  }, [forceSignOut, remainingSeconds, state.state, warningSeconds]);

  useEffect(() => { if (dialogOpen) dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus(); }, [dialogOpen]);

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Escape") { event.preventDefault(); void extend(); return; }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>("button")];
    if (focusable.length < 2) return;
    const index = focusable.indexOf(document.activeElement as HTMLElement);
    if (event.shiftKey && index <= 0) { event.preventDefault(); focusable[focusable.length - 1]?.focus(); }
    else if (!event.shiftKey && index === focusable.length - 1) { event.preventDefault(); focusable[0]?.focus(); }
  }

  if (!dialogOpen) return <span className="sr-only" aria-live="assertive">{announcement}</span>;
  return <>
    <div ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby="admin-session-timeout-title" aria-describedby="admin-session-timeout-description" onKeyDown={onKeyDown} className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/50 p-4">
      <div className="w-full max-w-md rounded-panel border bg-surface p-6 shadow-raised">
        <h2 id="admin-session-timeout-title" className="font-heading text-xl font-semibold">Are you still there?</h2>
        <p id="admin-session-timeout-description" className="mt-2 text-sm text-ink-muted">You will be signed out soon because of inactivity.</p>
        <p className="mt-4 text-center font-mono text-3xl font-semibold" aria-hidden="true">{formatCountdown(remainingSeconds)}</p>
        <p className="sr-only" aria-live="assertive">{announcement}</p>
        {dirty ? <p className="mt-3 text-sm text-danger">You have unsaved changes. Staying signed in will keep this page open.</p> : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => forceSignOut("timeout")}>Sign out</Button>
          <Button type="button" loading={saving} onClick={() => void extend()}>Stay signed in</Button>
        </div>
      </div>
    </div>
  </>;
}
