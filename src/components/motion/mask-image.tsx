"use client";

import { useState, type HTMLAttributes, type ReactNode } from "react";
import { useOnceInView } from "./motion-preference";

export function MaskImage({ children, className, priority = false, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode; priority?: boolean }) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const motion = useOnceInView(node, priority);
  return <div {...props} ref={setNode} data-motion-enabled={motion.enabled} data-motion-entered={motion.entered} className={`motion-mask ${className ?? ""}`}><div className="motion-mask-content">{children}</div><span className="motion-mask-curtain" aria-hidden="true" /></div>;
}
