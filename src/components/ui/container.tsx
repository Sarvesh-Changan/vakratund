import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ContainerVariant = "narrow" | "default" | "wide" | "full-bleed";
type SectionSpacing = "compact" | "default" | "generous";

const containerVariants: Record<ContainerVariant, string> = {
  narrow: "max-w-narrow",
  default: "max-w-default",
  wide: "max-w-wide",
  "full-bleed": "max-w-full px-0",
};

const sectionSpacing: Record<SectionSpacing, string> = {
  compact: "section-space-compact",
  default: "section-space",
  generous: "section-space-generous",
};

export function Container({ className, variant = "default", ...props }: HTMLAttributes<HTMLDivElement> & { variant?: ContainerVariant }) {
  return <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", containerVariants[variant], className)} {...props} />;
}

export function Section({ className, spacing = "default", ...props }: HTMLAttributes<HTMLElement> & { spacing?: SectionSpacing }) {
  return <section className={cn(sectionSpacing[spacing], className)} {...props} />;
}
