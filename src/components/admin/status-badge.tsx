import { Badge } from "@/components/ui";

type Status = "success" | "warning" | "danger" | "neutral" | "info";

const variants: Record<Status, "success" | "warning" | "danger" | "neutral" | "brand"> = { success: "success", warning: "warning", danger: "danger", neutral: "neutral", info: "brand" };

export function StatusBadge({ label, status = "neutral" }: { label: string; status?: Status }) {
  return <Badge variant={variants[status]}>{label}</Badge>;
}
