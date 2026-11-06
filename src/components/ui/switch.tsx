"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  hideLabel?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  label,
  hideLabel = false,
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: SwitchProps) {
  const [internal, setInternal] = useState(defaultChecked);
  const isChecked = checked ?? internal;
  const labelId = useId();

  const handleClick = () => {
    if (disabled) return;
    const next = !isChecked;
    if (checked === undefined) setInternal(next);
    onCheckedChange?.(next);
  };

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-labelledby={label && !hideLabel ? labelId : undefined}
        aria-label={ariaLabel || label || "Toggle"}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          isChecked ? "bg-purple-600" : "bg-zinc-300 dark:bg-zinc-700"
        )}
      >
        {/* Inner Label: ON (left) or OFF (right) */}
        <span
          className={cn(
            "pointer-events-none absolute text-[11px] font-black tracking-wider select-none transition-opacity duration-150",
            isChecked
              ? "left-2 text-white opacity-100"
              : "right-1.5 text-zinc-600 dark:text-zinc-300 opacity-100"
          )}
          aria-hidden="true"
        >
          {isChecked ? "ON" : "OFF"}
        </span>

        {/* Circular White Thumb */}
        <span
          className={cn(
            "pointer-events-none inline-block size-6 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out",
            isChecked ? "translate-x-7" : "translate-x-0"
          )}
          aria-hidden="true"
        />
      </button>

      {label && !hideLabel && (
        <span id={labelId} className="text-sm font-medium text-ink select-none">
          {label}
        </span>
      )}
    </div>
  );
}
