"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { focusRing } from "./styles";

export interface Tab { id: string; label: string; content: ReactNode; disabled?: boolean; }
export function Tabs({ tabs, defaultTab }: { tabs: Tab[]; defaultTab?: string }) {
  const first = tabs[0]?.id ?? "";
  const [active, setActive] = useState(defaultTab ?? first);
  return <div><div role="tablist" aria-label="Content sections" className="flex gap-1 overflow-x-auto border-b">{tabs.map((tab) => <button type="button" role="tab" aria-selected={active === tab.id} aria-controls={`${tab.id}-panel`} disabled={tab.disabled} key={tab.id} onClick={() => setActive(tab.id)} className={cn("min-h-11 shrink-0 border-b-2 border-transparent px-4 text-sm font-semibold text-ink-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-50", focusRing, active === tab.id && "border-brand-deep text-ink")}>{tab.label}</button>)}</div>{tabs.map((tab) => active === tab.id ? <div role="tabpanel" tabIndex={0} id={`${tab.id}-panel`} key={tab.id} className="pt-4">{tab.content}</div> : null)}</div>;
}
