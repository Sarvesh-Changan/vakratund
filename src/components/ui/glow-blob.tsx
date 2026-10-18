import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type GlowBlobProps = {
  className?: string;
  color?: "var(--glow-1)" | "var(--glow-2)" | "var(--glow-3)";
};

export function GlowBlob({ className, color = "var(--glow-1)" }: GlowBlobProps) {
  const style = { "--glow-color": color } as CSSProperties & { "--glow-color": string };

  return <span aria-hidden="true" className={cn("glow-blob pointer-events-none absolute size-56 rounded-full", className)} style={style} />;
}
