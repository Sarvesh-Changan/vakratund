import { EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/admin/page-header";

export function AdminModulePlaceholder({ title, description, permissionLabel }: { title: string; description: string; permissionLabel: string }) {
  return <div className="space-y-8"><PageHeader title={title} description={description} breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: title }]} /><EmptyState title={`${title} is ready for setup`} description={`This module is permission-gated with ${permissionLabel}. Its data views and mutations will be added in the next implementation phase.`} /></div>;
}
