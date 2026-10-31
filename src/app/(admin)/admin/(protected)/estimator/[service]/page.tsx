import { notFound } from "next/navigation";

import { EstimatorEditor } from "@/components/admin/estimator-editor";
import { PageHeader } from "@/components/admin";
import { requirePermission } from "@/lib/auth/session";
import { getEstimatorAdminData } from "@/server/services/estimator-admin";

export default async function EstimatorServicePage({ params }: { params: Promise<{ service: string }> }) {
  await requirePermission("estimator:write");
  const [{ service }, data] = await Promise.all([params, getEstimatorAdminData()]);
  const selected = data.services.find((item) => item.slug === service || item.id === service);
  if (!selected) notFound();
  return <div className="space-y-6"><PageHeader title={selected.name} eyebrow="Estimator service" description="Review visitor questions, prices and the live example before showing this service." /><EstimatorEditor data={data} initialServiceId={selected.id} /></div>;
}
