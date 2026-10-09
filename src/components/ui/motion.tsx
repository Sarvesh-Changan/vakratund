import type { ReactNode } from "react";



/** Keep public page sections server-rendered; motion is intentionally CSS-free by default. */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
