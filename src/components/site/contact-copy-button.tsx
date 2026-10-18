"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";

export function ContactCopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function copy(): Promise<void> {
    try { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { setCopied(false); }
  }
  return <button type="button" onClick={() => void copy()} className="inline-flex min-h-9 items-center gap-1.5 rounded-pill border border-line px-3 text-xs font-semibold text-ink-muted hover:border-accent hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2" aria-label={`Copy ${label}`}>{copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}{copied ? "Copied" : "Copy"}</button>;
}
