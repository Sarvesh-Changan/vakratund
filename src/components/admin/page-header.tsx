import type { ReactNode } from "react";

import { Breadcrumbs, SectionHeading } from "@/components/ui";

export function PageHeader({ title, description, eyebrow, breadcrumbs, action }: { title: string; description?: string; eyebrow?: string; breadcrumbs?: { label: string; href?: string }[]; action?: ReactNode }) {
  return <div className="space-y-4"><Breadcrumbs items={breadcrumbs ?? [{ label: "Admin", href: "/admin" }, { label: title }]} /><SectionHeading eyebrow={eyebrow} title={title} description={description} action={action} /></div>;
}
