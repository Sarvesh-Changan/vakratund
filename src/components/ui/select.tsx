import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { control } from "./styles";

export function Select({ className, "aria-invalid": invalid, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(control, "appearance-auto", invalid && "border-danger", className)} aria-invalid={invalid} {...props}>{children}</select>;
}
