import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin";
import { ServiceForm } from "@/components/admin/service-form";
import { requirePermission } from "@/lib/auth/session";
import { getService } from "@/server/services/services";
import { getMediaAsset } from "@/server/services/media";

type Params = Promise<{ id: string }>;

export default async function EditServicePage({ params }: { params: Params }) {
  await requirePermission("content:write");
  const { id } = await params;
  const service = await getService(id);
  if (!service) notFound();
  const initialCover = service.coverId ? await getMediaAsset(service.coverId) : null;
  return <div className="space-y-6"><PageHeader title={`Edit ${service.title}`} eyebrow="Services" description="Update the service content and publish controls." /><ServiceForm initial={service} initialCover={initialCover} /></div>;
}
