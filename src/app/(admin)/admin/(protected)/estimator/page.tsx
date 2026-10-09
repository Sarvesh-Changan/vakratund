import { EstimatorEditor } from "@/components/admin/estimator-editor";
import { requirePermission } from "@/lib/auth/session";
import { getEstimatorAdminData } from "@/server/services/estimator-admin";
import { PageHeader } from "@/components/admin";

export default async function EstimatorPage() {
  await requirePermission("estimator:write");
  const data = await getEstimatorAdminData();
  return <div className="space-y-6"><PageHeader title="Estimator" eyebrow="Pricing workspace" description="Manage active services, dynamic fields, safe pricing rules, location multipliers, and test scenarios." /><EstimatorEditor data={data} /></div>;
}
