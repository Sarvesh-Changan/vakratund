import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Tooltip({ label, children, className }: { label: string; children: ReactNode; className?: string }) { return <span className={cn("group relative inline-flex", className)}><span aria-describedby={`tooltip-${label.replace(/\W/g, "-")}`}>{children}</span><span role="tooltip" id={`tooltip-${label.replace(/\W/g, "-")}`} className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-56 -translate-x-1/2 rounded-control bg-charcoal px-2 py-1 text-xs text-surface opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">{label}</span></span>; }
