"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { useOnceInView } from "./motion-preference";

type RevealProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  delay?: number;
  priority?: boolean;
};
export function Reveal({
  children,
  delay = 0,
  priority = false,
  style,
  ...props
}: RevealProps) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const motion = useOnceInView(node, priority);
  return (
    <div
      {...props}
      ref={setNode}
      style={
        {
          ...style,
          "--motion-delay": `${Math.max(0, delay)}ms`,
        } as React.CSSProperties
      }
      data-motion-enabled={motion.enabled}
      data-motion-entered={motion.entered}
      className={`motion-reveal ${props.className ?? ""}`}
    >
      {children}
    </div>
  );
}

export function RevealGroup({
  children,
  staggerMs = 90,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  staggerMs?: number;
}) {
  return (
    <div {...props}>
      {Children.map(children, (child, index) =>
        isValidElement<RevealProps>(child) && child.type === Reveal
          ? cloneElement(child, {
              delay: (child.props.delay ?? 0) + index * staggerMs,
            })
          : child,
      )}
    </div>
  );
}
