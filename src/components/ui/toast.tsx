import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error";
export function Toast({ title, children, variant = "default", onDismiss }: { title: string; children?: ReactNode; variant?: ToastVariant; onDismiss?: () => void }) { return <div role="status" aria-live="polite" className={cn("flex max-w-sm items-start gap-4 rounded-card border bg-surface p-4 shadow-raised", variant === "success" && "border-success", variant === "error" && "border-danger")}><div className="min-w-0 flex-1"><p className="font-semibold">{title}</p>{children ? <p className="mt-1 text-sm text-ink-muted">{children}</p> : null}</div>{onDismiss ? <button type="button" className="min-h-10 min-w-10 rounded-control text-ink-muted hover:bg-surface-alt" onClick={onDismiss} aria-label="Dismiss notification">✕</button> : null}</div>; }
export function ToastViewport({ children }: { children: ReactNode }) { return <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-3" aria-label="Notifications">{children}</div>; }
