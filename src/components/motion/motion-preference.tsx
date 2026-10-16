"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const MotionContext = createContext(false);

export function MotionProvider({ children, forceReducedMotion = false }: { children: ReactNode; forceReducedMotion?: boolean }) {
  return <MotionContext.Provider value={forceReducedMotion}>{children}</MotionContext.Provider>;
}

export function useMotionPreference() {
  const forced = useContext(MotionContext);
  const [systemReduced, setSystemReduced] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(query.matches);
    const frame = requestAnimationFrame(update);
    query.addEventListener("change", update);
    const readyFrame = requestAnimationFrame(() => setReady(true));
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(readyFrame); query.removeEventListener("change", update); };
  }, []);

  return { reducedMotion: forced || systemReduced, ready };
}

export function useOnceInView(node: Element | null, disabled = false) {
  const { reducedMotion, ready } = useMotionPreference();
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!ready || disabled || reducedMotion || !node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setEntered(true);
        observer.disconnect();
      }
    }, { threshold: 0.12 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [disabled, node, ready, reducedMotion]);

  const observerUnsupported = typeof IntersectionObserver === "undefined";
  return { entered: disabled || !ready || reducedMotion || observerUnsupported || entered, enabled: ready && !disabled && !reducedMotion };
}
