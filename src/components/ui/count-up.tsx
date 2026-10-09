"use client";

import { useEffect, useState } from "react";

export function CountUp({ value, duration = 900, className }: { value: number; duration?: number; className?: string }) {
  const [count, setCount] = useState(value);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const startedAt = performance.now();
    let frame = 0;
    const update = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(value * eased);
      if (progress < 1) frame = window.requestAnimationFrame(update);
    };

    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, value]);

  return <span className={className}>{Math.round(count).toLocaleString("en-IN")}</span>;
}
