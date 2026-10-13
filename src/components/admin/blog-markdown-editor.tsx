"use client";

import { useEffect, useRef, useState } from "react";

import { MarkdownRenderer } from "@/lib/markdown";
import { cn } from "@/lib/utils";

export function BlogMarkdownEditor({ value, onChange, insertImage }: { value: string; onChange: (value: string) => void; insertImage?: { markdown: string; key: number } | null }) {
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastInsertKey = useRef<number | null>(null);
  useEffect(() => {
    if (!insertImage || preview || lastInsertKey.current === insertImage.key) return;
    lastInsertKey.current = insertImage.key;
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? start;
    const nextValue = `${value.slice(0, start)}${insertImage.markdown}${value.slice(end)}`;
    onChange(nextValue);
    window.requestAnimationFrame(() => { textarea.focus(); const cursor = start + insertImage.markdown.length; textarea.setSelectionRange(cursor, cursor); });
  }, [insertImage, onChange, preview, value]);
  return <div className="overflow-hidden rounded-control border bg-surface"><div className="flex items-center justify-between border-b bg-surface-alt px-3 py-2 text-xs font-semibold text-ink-muted"><span>Markdown editor</span><div className="flex gap-1" role="tablist" aria-label="Blog content editor mode"><button type="button" role="tab" aria-selected={!preview} className={cn("rounded-control px-3 py-1.5", !preview && "bg-surface text-ink")} onClick={() => setPreview(false)}>Write</button><button type="button" role="tab" aria-selected={preview} className={cn("rounded-control px-3 py-1.5", preview && "bg-surface text-ink")} onClick={() => setPreview(true)}>Preview</button></div></div>{preview ? <div className="prose prose-sm min-h-72 max-w-none p-4 text-ink"><MarkdownRenderer content={value || "Nothing to preview yet."} /></div> : <textarea ref={textareaRef} value={value} onChange={(event) => onChange(event.target.value)} rows={16} className="min-h-72 w-full resize-y border-0 bg-transparent p-4 text-base text-ink outline-none" placeholder="Write the article in Markdown..." aria-label="Blog post Markdown content" />}</div>;
}
