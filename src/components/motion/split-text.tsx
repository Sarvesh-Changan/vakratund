"use client";

import { useState, type CSSProperties } from "react";
import { useOnceInView } from "./motion-preference";

export function SplitText({ children, as: Tag = "span", mode = "words", className, priority = false, highlight }: { children: string; as?: "span" | "h1" | "h2" | "h3" | "p"; mode?: "words" | "lines"; className?: string; priority?: boolean; highlight?: string }) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const motion = useOnceInView(node, priority);
  const parts = mode === "lines" ? children.split("\n") : children.trim().split(/\s+/);
  return <Tag ref={setNode} aria-label={children.replace(/\s+/g, " ").trim()} data-split-mode={mode} data-motion-enabled={motion.enabled} data-motion-entered={motion.entered} className={`motion-split ${className ?? ""}`}>{parts.map((part, index) => <span aria-hidden="true" className="motion-split-part" key={`${index}-${part}`} style={{ "--motion-index": index } as CSSProperties}>{highlight && part.toLowerCase() === highlight.toLowerCase() ? <mark className="hl">{part}</mark> : part}</span>)}</Tag>;
}
