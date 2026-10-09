import { Building2, Droplets, HardHat, House, Landmark, Paintbrush, PanelsTopLeft, Road, Ruler, ShieldCheck, Wrench, type LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = {
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

export function ServiceIcon({ iconKey, size = 24 }: { iconKey: string | null; size?: number }) {
  const Icon = iconKey ? icons[iconKey] ?? Building2 : Building2;
  return <Icon size={size} aria-hidden="true" />;
}
