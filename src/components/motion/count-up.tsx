"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionPreference, useOnceInView } from "./motion-preference";

type Easing = "easeOutCubic" | "easeOutQuad" | "linear";
export function CountUp({ value, duration = 900, className, prefix = "", suffix = "", easing = "easeOutCubic" }: { value: number; duration?: number; className?: string; prefix?: string; suffix?: string; easing?: Easing }) {
  const [count, setCount] = useState(value);
  const started = useRef(false);
  const [node, setNode] = useState<HTMLSpanElement | null>(null);
  const motion = useOnceInView(node);
  const { reducedMotion } = useMotionPreference();
  useEffect(() => {
    if (!motion.entered || reducedMotion || started.current) return;
    started.current = true;
    const start = performance.now();
    let frame = 0;
    const update = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = easing === "linear" ? progress : easing === "easeOutQuad" ? 1 - (1 - progress) ** 2 : 1 - (1 - progress) ** 3;
      setCount(value * eased);
      if (progress < 1) frame = requestAnimationFrame(update);
      else setCount(value);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [duration, easing, motion.entered, reducedMotion, value]);
  const format = (number: number) => `${prefix}${Math.round(number).toLocaleString("en-IN")}${suffix}`;
  return <span ref={setNode} className={className} aria-label={format(value)}><span className="sr-only">{format(value)}</span><span aria-hidden="true" className="motion-count-value">{format(reducedMotion ? value : count)}</span></span>;
}
