"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { useMotionPreference } from "./motion-preference";

export function ScrollLinkedProgress({ children, className, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const { ready, reducedMotion } = useMotionPreference();
  const active = ready && !reducedMotion;

  useEffect(() => {
    const element = root.current;
    if (!active || !element) return;
    if (CSS.supports("animation-timeline: view()")) {
      element.dataset.nativeTimeline = "true";
      return () => { delete element.dataset.nativeTimeline; };
    }

    const mobile = window.matchMedia("(max-width: 767px)");
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = element.getBoundingClientRect();
        const start = window.innerHeight * 0.8;
        const end = -bounds.height * 0.2;
        const progress = Math.max(0, Math.min(1, (start - bounds.top) / (start - end)));
        element.style.setProperty("--scroll-linked-progress", String(progress));
        element.dataset.axis = mobile.matches ? "vertical" : "horizontal";
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    mobile.addEventListener("change", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      mobile.removeEventListener("change", update);
      delete element.dataset.axis;
    };
  }, [active]);

  return <div {...props} ref={root} className={`scroll-linked-progress ${className ?? ""}`} data-motion-active={active}>
    <span className="scroll-linked-progress-track" aria-hidden="true"><span className="scroll-linked-progress-fill" /></span>
    {children}
  </div>;
}
