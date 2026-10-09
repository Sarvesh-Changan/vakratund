import { PageHeader } from "@/components/admin";
import { ServiceForm } from "@/components/admin/service-form";
import { requirePermission } from "@/lib/auth/session";
import { listMediaAssets } from "@/server/services/media";

export default async function NewServicePage() {
  await requirePermission("content:write");
  const assets = await listMediaAssets();
  return <div className="space-y-6"><PageHeader title="New service" eyebrow="Services" description="Create a public service entry with its description, scope, media, and SEO metadata." /><ServiceForm initial={null} assets={assets} /></div>;
}
