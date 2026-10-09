import type { ReactNode } from "react";

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="space-y-4 rounded-card border bg-surface p-4 shadow-soft sm:p-6"><div><h2 className="font-heading text-lg font-semibold">{title}</h2>{description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}</div>{children}</section>;
}
