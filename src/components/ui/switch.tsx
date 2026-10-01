"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { focusRing } from "./styles";

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Switch({ checked, defaultChecked = false, onCheckedChange, label = "Toggle setting", disabled = false }: SwitchProps) {
  const [internal, setInternal] = useState(defaultChecked);
  const isChecked = checked ?? internal;
  const labelId = useId();
  const handleClick = () => {
    if (disabled) return;
    const next = !isChecked;
    if (checked === undefined) setInternal(next);
    onCheckedChange?.(next);
  };
  return <button type="button" role="switch" aria-checked={isChecked} aria-labelledby={labelId} disabled={disabled} onClick={handleClick} className={cn("inline-flex min-h-11 items-center gap-3 disabled:cursor-not-allowed disabled:opacity-50", focusRing)}>
    <span aria-hidden="true" className={cn("relative h-6 w-11 rounded-pill bg-line transition-colors", isChecked && "bg-brand")}><span className={cn("absolute top-1 left-1 size-4 rounded-full bg-surface shadow-sm transition-transform", isChecked && "translate-x-5")} /></span>
    <span id={labelId}>{label}</span>
  </button>;
}
