"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface DialogProps { open: boolean; onClose: () => void; title: string; children: ReactNode; description?: string; className?: string; center?: boolean; }
export function Dialog({ open, onClose, title, description, children, className, center = false }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  useEffect(() => { const dialog = ref.current; if (!dialog) return; if (open && !dialog.open) { previousActiveElement.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; dialog.showModal(); } if (!open && dialog.open) dialog.close(); }, [open]);
  const restoreFocus = () => { const target = previousActiveElement.current; onClose(); window.requestAnimationFrame(() => target?.focus()); };
  const handleCancel = (event: React.SyntheticEvent<HTMLDialogElement>) => { event.preventDefault(); restoreFocus(); };
  return <dialog ref={ref} aria-label={title} onCancel={handleCancel} onClose={() => window.requestAnimationFrame(() => previousActiveElement.current?.focus())} className={cn("m-auto max-w-lg rounded-panel border border-line bg-bg p-0 text-ink shadow-raised backdrop:bg-dark/60 backdrop:backdrop-blur-sm", className)}>
    <div className="space-y-5 p-6"><div className="relative flex items-start justify-between gap-4"><div className={cn(center && "w-full text-center")}><h2 className="text-xl font-semibold">{title}</h2>{description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}</div><Button type="button" variant="ghost" size="sm" className={cn(center && "absolute right-0 -top-3")} aria-label="Close dialog" onClick={onClose}>✕</Button></div>{children}</div>
  </dialog>;
}

export function DialogPanel({ className, children }: { className?: string; children: ReactNode }) { return <div className={cn("space-y-4", className)}>{children}</div>; }
