"use client";

import { useState } from "react";

import { Button, Dialog, DialogPanel } from "@/components/ui";

export function ConfirmDialog({ title, description, confirmLabel = "Confirm", onConfirm, children }: { title: string; description: string; confirmLabel?: string; onConfirm: () => void | Promise<void>; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  async function confirm() { setLoading(true); await onConfirm(); setLoading(false); setOpen(false); }
  return <><span onClick={() => setOpen(true)}>{children}</span><Dialog open={open} onClose={() => setOpen(false)} title={title} description={description} center><DialogPanel><div className="flex justify-center gap-3"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="button" loading={loading} onClick={confirm}>{confirmLabel}</Button></div></DialogPanel></Dialog></>;
}
