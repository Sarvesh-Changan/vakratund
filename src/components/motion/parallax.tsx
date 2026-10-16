"use client";

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useMotionPreference } from "./motion-preference";

export function Parallax({ children, speed = 0.2, className, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode; speed?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { ready, reducedMotion } = useMotionPreference();
  const [active, setActive] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px) and (pointer: fine)");
    const update = () => setActive(ready && !reducedMotion && media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [ready, reducedMotion]);
  useEffect(() => {
    if (!active || !ref.current) return;
    const element = ref.current;
    if (CSS.supports("animation-timeline: view()")) {
      element.dataset.nativeTimeline = "true";
      return () => { delete element.dataset.nativeTimeline; };
    }
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const travel = Math.max(-100, Math.min(100, (window.innerHeight / 2 - (rect.top + rect.height / 2)) * speed));
        element.style.setProperty("--motion-parallax-y", `${travel}px`);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [active, speed]);
  const distance = speed * 5;
  return <div {...props} ref={ref} className={`motion-parallax ${className ?? ""}`} data-motion-active={active} style={{ ...props.style, "--motion-parallax-distance": `${distance}rem`, "--motion-parallax-distance-negative": `${-distance}rem` } as CSSProperties}>{children}</div>;
}
