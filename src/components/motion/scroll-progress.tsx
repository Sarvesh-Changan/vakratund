"use client";

import { useEffect, useState } from "react";
import { useMotionPreference } from "./motion-preference";

export function ScrollProgress({ className }: { className?: string }) {
  const { ready, reducedMotion } = useMotionPreference();
  const [nativeTimeline, setNativeTimeline] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setNativeTimeline(CSS.supports("animation-timeline: scroll(root block)")));
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!ready || reducedMotion || nativeTimeline) return;
    const bar = document.querySelector<HTMLElement>(".motion-scroll-progress");
    if (!bar) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const range = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.setProperty("--motion-scroll-scale", String(range > 0 ? window.scrollY / range : 0));
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [nativeTimeline, ready, reducedMotion]);
  if (!ready || reducedMotion) return null;
  return <div aria-hidden="true" className={`motion-scroll-progress ${className ?? ""}`} data-native-timeline={nativeTimeline} />;
}
