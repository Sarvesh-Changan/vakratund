import Image from "next/image";

import { cn } from "@/lib/utils";

export function BrandLogo({ alt = "", className, width = 48, height = 48, priority = false }: { alt?: string; className?: string; width?: number; height?: number; priority?: boolean }) {
  return <Image src="/vk_logo.png" alt={alt} width={width} height={height} priority={priority} className={cn("object-contain", className)} />;
}
