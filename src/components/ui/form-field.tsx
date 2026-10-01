import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export function FormField({ label, htmlFor, hint, error, required, children }: FormFieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  return <div className="space-y-1.5"><label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">{label}{required ? <span className="ml-1 text-danger" aria-hidden="true">*</span> : null}</label>{children}<div className="min-h-5 text-sm">{error ? <p id={errorId} className="text-danger" role="alert">{error}</p> : hint ? <p id={hintId} className="text-ink-muted">{hint}</p> : null}</div></div>;
}

export function fieldDescribedBy(htmlFor: string, hint?: string, error?: string) {
  return cn(hint && `${htmlFor}-hint`, error && `${htmlFor}-error`) || undefined;
}
