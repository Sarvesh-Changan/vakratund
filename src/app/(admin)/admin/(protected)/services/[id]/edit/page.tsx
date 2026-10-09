import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin";
import { ServiceForm } from "@/components/admin/service-form";
import { requirePermission } from "@/lib/auth/session";
import { listMediaAssets } from "@/server/services/media";
import { getService } from "@/server/services/services";

type Params = Promise<{ id: string }>;

export default async function EditServicePage({ params }: { params: Params }) {
  await requirePermission("content:write");
  const { id } = await params;
  const [service, assets] = await Promise.all([getService(id), listMediaAssets()]);
  if (!service) notFound();
  return <div className="space-y-6"><PageHeader title={`Edit ${service.title}`} eyebrow="Services" description="Update the service content and publish controls." /><ServiceForm initial={service} assets={assets} /></div>;
}
