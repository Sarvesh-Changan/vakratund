import Link from "next/link";
import { cn } from "@/lib/utils";

export interface Breadcrumb { label: string; href?: string; }
export function Breadcrumbs({ items, className }: { items: Breadcrumb[]; className?: string }) { return <nav aria-label="Breadcrumb" className={cn("text-sm", className)}><ol className="flex flex-wrap items-center gap-2 text-ink-muted">{items.map((item, index) => <li key={`${item.label}-${index}`} className="flex items-center gap-2">{index > 0 ? <span aria-hidden="true">/</span> : null}{item.href && index < items.length - 1 ? <Link href={item.href} className="hover:text-brand-deep hover:underline">{item.label}</Link> : <span aria-current={index === items.length - 1 ? "page" : undefined} className={index === items.length - 1 ? "font-semibold text-ink" : undefined}>{item.label}</span>}</li>)}</ol></nav>; }
