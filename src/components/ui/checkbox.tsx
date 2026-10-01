import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { focusRing } from "./styles";

export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="checkbox" className={cn("size-5 rounded border accent-brand", focusRing, className)} {...props} />;
}
