"use client";

import { useState } from "react";

import { MarkdownRenderer } from "@/lib/markdown";
import { cn } from "@/lib/utils";

export function ServiceMarkdownEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [preview, setPreview] = useState(false);
  return <div className="overflow-hidden rounded-control border bg-surface">
    <div className="flex items-center justify-between border-b bg-surface-alt px-3 py-2 text-xs font-semibold text-ink-muted">
      <span>Markdown</span>
      <div className="flex gap-1" role="tablist" aria-label="Description editor mode">
        <button type="button" role="tab" aria-selected={!preview} className={cn("rounded-control px-3 py-1.5", !preview && "bg-surface text-ink")} onClick={() => setPreview(false)}>Write</button>
        <button type="button" role="tab" aria-selected={preview} className={cn("rounded-control px-3 py-1.5", preview && "bg-surface text-ink")} onClick={() => setPreview(true)}>Preview</button>
      </div>
    </div>
    {preview ? <div className="prose prose-sm min-h-48 max-w-none p-4 text-ink"><MarkdownRenderer content={value || "Nothing to preview yet."} /></div> : <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={12} className="min-h-48 w-full resize-y border-0 bg-transparent p-4 text-base text-ink outline-none" placeholder="Explain the service in Markdown..." aria-label="Service Markdown description" />}
  </div>;
}
