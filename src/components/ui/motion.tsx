"use client";

import { animate, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

export function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 18 }} whileInView={reduce ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}

export function CountUp({ value, duration = 900, className }: { value: number; duration?: number; className?: string }) {
  const reduce = useReducedMotion();
  const [count, setCount] = useState(0);
  useEffect(() => { if (reduce) return; const controls = animate(0, value, { duration: duration / 1000, ease: "easeOut", onUpdate: setCount }); return () => controls.stop(); }, [duration, reduce, value]);
  return <span className={className}>{Math.round(reduce ? value : count).toLocaleString("en-IN")}</span>;
}
