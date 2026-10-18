import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { focusRing } from "./styles";

type ButtonVariant = "primary" | "secondary" | "dark" | "outline-on-dark" | "outline-on-light" | "ghost" | "link";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-ink shadow-soft hover:-translate-y-0.5 hover:bg-accent/90 hover:shadow-raised",
  secondary: "bg-accent-2 text-accent-2-ink shadow-soft hover:-translate-y-0.5 hover:brightness-95 hover:shadow-raised",
  dark: "bg-dark text-white shadow-soft hover:-translate-y-0.5 hover:bg-dark/90 hover:shadow-raised",
  "outline-on-dark": "border border-white/70 bg-transparent text-white hover:-translate-y-0.5 hover:border-accent-2 hover:text-accent-2",
  "outline-on-light": "border border-accent bg-transparent text-accent-ink hover:-translate-y-0.5 hover:bg-accent/10",
  ghost: "text-ink hover:bg-surface-alt",
  link: "text-accent-ink underline-offset-4 hover:underline",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-10 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-6 text-base",
};

export function Button({ className, variant = "primary", size = "md", loading = false, disabled, children, ...props }: ButtonProps) {
  const withArrow = variant === "primary" || variant === "secondary" || variant === "dark" || variant === "outline-on-dark" || variant === "outline-on-light";
  return (
    <button className={cn("inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-[background-color,border-color,box-shadow,transform,color] duration-200", focusRing, variants[variant], sizes[size], className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : null}
      {children}
      {withArrow ? <span className="button-arrow" aria-hidden="true">{"\u2197"}</span> : null}
    </button>
  );
}
