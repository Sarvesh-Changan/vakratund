import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { control } from "./styles";

export function Textarea({ className, "aria-invalid": invalid, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-28 resize-y", invalid && "border-danger", className)} aria-invalid={invalid} {...props} />;
}
