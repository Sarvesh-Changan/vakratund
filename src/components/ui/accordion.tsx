import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface AccordionItemProps { title: string; children: ReactNode; defaultOpen?: boolean; }
export function Accordion({ children, className }: { children: ReactNode; className?: string }) { return <div className={cn("divide-y rounded-card border", className)}>{children}</div>; }
export function AccordionItem({ title, children, defaultOpen = false }: AccordionItemProps) { return <details className="group p-4" open={defaultOpen}><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">{title}<span aria-hidden="true" className="text-brand-deep transition-transform group-open:rotate-45">+</span></summary><div className="pt-3 text-ink-muted">{children}</div></details>; }
