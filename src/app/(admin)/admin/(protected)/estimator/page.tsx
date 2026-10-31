import { EstimatorEditor } from "@/components/admin/estimator-editor";
import { requirePermission } from "@/lib/auth/session";
import { getEstimatorAdminData } from "@/server/services/estimator-admin";
import { PageHeader } from "@/components/admin";

export default async function EstimatorPage() {
  await requirePermission("estimator:write");
  const data = await getEstimatorAdminData();
  return <div className="space-y-6"><PageHeader title="Estimator" eyebrow="Pricing workspace" description="Manage visitor questions, approved prices and location surcharges." /><details className="rounded-card border bg-surface p-5"><summary className="cursor-pointer font-semibold">How pricing works</summary><ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{["1. Start with the base price", "2. Visitor choices can change it", "3. A location surcharge may apply", "4. Show the range and round it"].map((step) => <li key={step} className="rounded-control border bg-surface-alt p-3 text-sm">{step}</li>)}</ol><p className="mt-4 text-sm text-ink-muted">Example: 1,000 sq ft × ₹2,000 = ₹20,00,000 before any answer choices or location surcharge. The displayed range includes the set percentage and rounding.</p></details><EstimatorEditor data={data} /></div>;
}
