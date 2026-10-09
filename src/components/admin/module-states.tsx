import { Button, ErrorState } from "@/components/ui";
import { TableSkeleton } from "@/components/admin/table-skeleton";

export function AdminModuleLoading() {
  return <div className="space-y-6"><TableSkeleton /></div>;
}

export function AdminModuleError({ reset }: { reset: () => void }) {
  return <ErrorState title="Unable to load this module" description="Please try again. If the problem continues, contact a SUPER_ADMIN." action={<Button type="button" variant="secondary" onClick={reset}>Try again</Button>} />;
}
