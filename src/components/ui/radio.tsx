import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { focusRing } from "./styles";

export function Radio({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="radio" className={cn("size-5 border accent-brand", focusRing, className)} {...props} />;
}
