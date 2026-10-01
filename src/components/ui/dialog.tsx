"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface DialogProps { open: boolean; onClose: () => void; title: string; children: ReactNode; description?: string; className?: string; }
export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; if (!dialog) return; if (open && !dialog.open) dialog.showModal(); if (!open && dialog.open) dialog.close(); }, [open]);
  return <dialog ref={ref} onCancel={onClose} onClose={onClose} className={cn("m-auto max-w-lg rounded-panel border bg-surface p-0 text-ink shadow-raised backdrop:bg-charcoal/60 backdrop:backdrop-blur-sm", className)}>
    <div className="space-y-5 p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">{title}</h2>{description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}</div><Button type="button" variant="ghost" size="sm" aria-label="Close dialog" onClick={onClose}>✕</Button></div>{children}</div>
  </dialog>;
}

export function DialogPanel({ className, children }: { className?: string; children: ReactNode }) { return <div className={cn("space-y-4", className)}>{children}</div>; }
