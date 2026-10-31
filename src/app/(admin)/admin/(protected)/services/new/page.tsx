import { PageHeader } from "@/components/admin";
import { ServiceForm } from "@/components/admin/service-form";
import { requirePermission } from "@/lib/auth/session";

export default async function NewServicePage() {
  await requirePermission("content:write");
  return <div className="space-y-6"><PageHeader title="New service" eyebrow="Services" description="Create a public service entry with its description, scope, media, and visitor-facing details." /><ServiceForm initial={null} initialCover={null} /></div>;
}
