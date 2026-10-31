"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useOnceInView } from "@/components/motion/motion-preference";
import styles from "./illustration-canvas.module.css";

export function IllustrationCanvas({ children, className, ariaLabel, description, decorative = false }: { children: ReactNode; className?: string; ariaLabel: string; description: string; decorative?: boolean }) {
  const [node, setNode] = useState<SVGSVGElement | null>(null);
  const motion = useOnceInView(node);
  const animate = motion.enabled && typeof IntersectionObserver !== "undefined";
  const titleId = useId();
  const descriptionId = useId();

  return <svg ref={setNode} viewBox="0 0 800 600" data-motion-state={animate ? motion.entered ? "entered" : "pending" : "static"} className={cn(styles.illustration, animate && !motion.entered && styles.motionPending, animate && motion.entered && styles.motionEntered, className)} role={decorative ? undefined : "img"} aria-hidden={decorative || undefined} aria-labelledby={decorative ? undefined : titleId} aria-describedby={decorative ? undefined : descriptionId}>
    {!decorative ? <><title id={titleId}>{ariaLabel}</title><desc id={descriptionId}>{description}</desc></> : null}
    {children}
  </svg>;
}

