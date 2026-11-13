"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";

export function FilterPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="mb-3 inline-flex min-h-11 items-center gap-2 rounded-pill border border-line bg-surface px-5 text-sm font-semibold text-ink shadow-soft focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2">
        <SlidersHorizontal size={16} aria-hidden="true" />{open ? "Hide Filters" : "Filters"}
      </button>
      {open ? children : null}
    </div>
  );
}
