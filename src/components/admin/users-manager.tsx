"use client";

import { useState } from "react";

import { createUserAction, revokeUserSessionsAction, triggerPasswordResetAction, unlockUserLockoutAction, updateUserAction } from "@/app/(admin)/admin/(protected)/users/actions";

type User = { id: string; name: string; email: string; role: "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "SALES"; isActive: boolean; mustChangePassword: boolean; sessionCount: number };
type Lockout = { userId: string; maskedEmail: string; lockedUntil: string };

function formatLockout(value: string): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function UsersManager({ initial, lockouts: initialLockouts }: { initial: User[]; lockouts: Lockout[] }) {
  const [users, setUsers] = useState(initial);
  const [lockouts, setLockouts] = useState(initialLockouts);
  const [form, setForm] = useState({ name: "", email: "", temporaryPassword: "", role: "EDITOR" as User["role"], mustChangePassword: true });
  const [message, setMessage] = useState("");

  async function create(event: React.FormEvent) {
    event.preventDefault();
    const result = await createUserAction(form);
    setMessage(result.ok ? "User created." : "User could not be created.");
    if (result.ok) {
      setUsers((current) => [...current, result.data]);
      setForm({ name: "", email: "", temporaryPassword: "", role: "EDITOR", mustChangePassword: true });
    }
  }

  async function access(user: User, patch: Partial<User>) {
    const result = await updateUserAction({ id: user.id, name: user.name, email: user.email, role: patch.role ?? user.role, isActive: patch.isActive ?? user.isActive });
    setMessage(result.ok ? "User updated." : "User could not be updated.");
    if (result.ok) setUsers((current) => current.map((item) => item.id === user.id ? result.data : item));
  }

  async function unlock(lockout: Lockout) {
    const result = await unlockUserLockoutAction({ id: lockout.userId });
    setMessage(result.ok ? "Lockout cleared." : "Lockout could not be cleared.");
    if (result.ok) setLockouts((current) => current.filter((item) => item.userId !== lockout.userId));
  }

  return <div className="space-y-8">
    {message ? <p role="status">{message}</p> : null}
    <section className="space-y-3 rounded-panel border bg-white p-5" aria-labelledby="locked-accounts-heading">
      <div><h2 id="locked-accounts-heading" className="font-display text-xl">Locked accounts</h2><p className="text-sm text-ink-muted">Temporary sign-in lockouts. Emails are masked and no password information is shown.</p></div>
      {lockouts.length === 0 ? <p className="text-sm text-ink-muted">No active lockouts.</p> : <div className="space-y-2">{lockouts.map((lockout) => <article key={lockout.userId} className="flex flex-wrap items-center justify-between gap-3 rounded-control border p-3"><div><strong>{lockout.maskedEmail}</strong><p className="text-sm text-ink-muted">Locked until {formatLockout(lockout.lockedUntil)}</p></div><button type="button" onClick={() => void unlock(lockout)} className="rounded-control border px-3 py-2">Unlock</button></article>)}</div>}
    </section>
    <form onSubmit={create} className="grid gap-3 rounded-panel border bg-white p-5 sm:grid-cols-2"><h2 className="font-display text-xl sm:col-span-2">Create staff account</h2>{(["name", "email", "temporaryPassword"] as const).map((key) => <input key={key} required type={key === "temporaryPassword" ? "password" : key} placeholder={key} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="rounded-control border p-2" />)}<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as User["role"] })} className="rounded-control border p-2"><option>EDITOR</option><option>ADMIN</option><option>SALES</option><option>SUPER_ADMIN</option></select><label><input type="checkbox" checked={form.mustChangePassword} onChange={(event) => setForm({ ...form, mustChangePassword: event.target.checked })} /> Must change password</label><button className="w-fit rounded-control bg-brand px-4 py-2 font-semibold">Create</button></form>
    <div className="space-y-3">{users.map((user) => <article key={user.id} className="grid gap-3 rounded-panel border bg-white p-5 sm:grid-cols-4"><div><strong>{user.name}</strong><p className="text-sm">{user.email}</p></div><select aria-label={`Role for ${user.name}`} value={user.role} onChange={(event) => void access(user, { role: event.target.value as User["role"] })} className="rounded-control border p-2"><option>SUPER_ADMIN</option><option>ADMIN</option><option>EDITOR</option><option>SALES</option></select><button type="button" onClick={() => void access(user, { isActive: !user.isActive })} className="rounded-control border px-3 py-2">{user.isActive ? "Deactivate" : "Reactivate"}</button><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void revokeUserSessionsAction({ id: user.id })} className="rounded-control border px-3 py-2">Revoke sessions</button><button type="button" onClick={() => void triggerPasswordResetAction({ id: user.id })} className="rounded-control border px-3 py-2">Reset password</button></div></article>)}</div>
  </div>;
}
