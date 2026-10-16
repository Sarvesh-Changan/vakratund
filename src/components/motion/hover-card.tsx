"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { useMotionPreference } from "./motion-preference";

export function HoverCard({ children, className, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  const { ready, reducedMotion } = useMotionPreference();
  return <div {...props} className={`motion-hover-card ${className ?? ""}`} data-motion-enabled={ready && !reducedMotion}>{children}</div>;
}
