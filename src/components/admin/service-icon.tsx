import { Building2, Droplets, HardHat, House, Landmark, Paintbrush, PanelsTopLeft, Road, Ruler, ShieldCheck, Wrench, type LucideIcon } from "lucide-react";

import { SERVICE_ICON_KEYS } from "@/lib/validation/services";

const icons: Record<(typeof SERVICE_ICON_KEYS)[number], LucideIcon> = {
  Building2,
  HardHat,
  Ruler,
  Wrench,
  Paintbrush,
  Droplets,
  House,
  Road,
  Landmark,
  PanelsTopLeft,
  ShieldCheck,
};

export function ServiceIcon({ iconKey, size = 20 }: { iconKey: string | null; size?: number }) {
  const Icon = iconKey && iconKey in icons ? icons[iconKey as keyof typeof icons] : Building2;
  return <Icon size={size} aria-hidden="true" />;
}

export { icons as serviceIcons };
