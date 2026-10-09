import { Skeleton } from "@/components/ui";

export function TableSkeleton({ rows = 6, columns = 4 }: { rows?: number; columns?: number }) {
  return <div aria-label="Loading table" className="space-y-3" role="status">{Array.from({ length: rows }, (_, row) => <div className="grid gap-3 sm:grid-cols-4" key={row}>{Array.from({ length: columns }, (_, column) => <Skeleton className="h-11" key={column} />)}</div>)}</div>;
}
