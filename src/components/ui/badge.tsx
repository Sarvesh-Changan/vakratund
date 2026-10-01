import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "brand";
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> { variant?: BadgeVariant; }

const variants: Record<BadgeVariant, string> = { neutral: "bg-surface-alt text-ink", success: "bg-success/15 text-success", warning: "bg-warning/15 text-warning", danger: "bg-danger/15 text-danger", brand: "bg-brand/20 text-brand-deep" };

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) { return <span className={cn("inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-semibold", variants[variant], className)} {...props} />; }
