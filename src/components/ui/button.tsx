import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { focusRing } from "./styles";

type ButtonVariant = "primary" | "secondary" | "ghost" | "link";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-ink hover:bg-brand/90",
  secondary: "border bg-surface text-ink hover:bg-surface-alt",
  ghost: "text-ink hover:bg-surface-alt",
  link: "text-brand-deep underline-offset-4 hover:underline",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-10 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-6 text-base",
};

export function Button({ className, variant = "primary", size = "md", loading = false, disabled, children, ...props }: ButtonProps) {
  return (
    <button className={cn("inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors", focusRing, variants[variant], sizes[size], className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
