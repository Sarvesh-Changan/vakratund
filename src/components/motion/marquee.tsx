"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMotionPreference } from "./motion-preference";

export function Marquee({ children, label, durationSeconds = 36, reverse = false, className }: { children: ReactNode; label: string; durationSeconds?: number; reverse?: boolean; className?: string }) {
  const { ready, reducedMotion } = useMotionPreference();
  return <div role="group" aria-label={label} className={`motion-marquee ${className ?? ""}`} data-motion-enabled={ready && !reducedMotion} style={{ "--motion-duration": `${Math.max(8, durationSeconds)}s`, "--motion-direction": reverse ? "reverse" : "normal" } as CSSProperties}><div className="motion-marquee-track">{children}<span aria-hidden="true">{children}</span></div></div>;
}
