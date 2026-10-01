import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { control } from "./styles";

export function Input({ className, "aria-invalid": invalid, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, invalid && "border-danger", className)} aria-invalid={invalid} {...props} />;
}
