import { DataTable, PageHeader } from "@/components/admin";
import { Badge } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { listActivity } from "@/server/services/activity";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ActivityPage({ searchParams }: { searchParams: SearchParams }) {
  await requirePermission("activity:read");
  const params = await searchParams;
  const q = first(params.q);
  const user = first(params.user);
  const action = first(params.action);
  const entity = first(params.entity);
  const from = first(params.from);
  const to = first(params.to);
  const requestedPage = Number(first(params.page) ?? "1");
  const result = await listActivity({ q, user, action, entity, from, to, page: Number.isFinite(requestedPage) ? requestedPage : 1 });

  return <div className="space-y-6">
    <PageHeader title="Activity" eyebrow="Audit trail" description="Review the immutable record of administrative and authentication events." />
    <form method="get" action="/admin/activity" className="grid gap-3 rounded-card border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-5">
      <label className="text-sm font-semibold text-ink">User<input name="user" defaultValue={user} placeholder="Name, email, or ID" className="mt-1 min-h-11 w-full rounded-control border bg-surface px-3 font-normal text-ink focus-visible:outline-2 focus-visible:outline-brand-deep focus-visible:outline-offset-2" /></label>
      <label className="text-sm font-semibold text-ink">Action<input name="action" defaultValue={action} placeholder="auth.login" className="mt-1 min-h-11 w-full rounded-control border bg-surface px-3 font-normal text-ink focus-visible:outline-2 focus-visible:outline-brand-deep focus-visible:outline-offset-2" /></label>
      <label className="text-sm font-semibold text-ink">Entity<input name="entity" defaultValue={entity} placeholder="Lead or Auth" className="mt-1 min-h-11 w-full rounded-control border bg-surface px-3 font-normal text-ink focus-visible:outline-2 focus-visible:outline-brand-deep focus-visible:outline-offset-2" /></label>
      <label className="text-sm font-semibold text-ink">From<input type="date" name="from" defaultValue={from} className="mt-1 min-h-11 w-full rounded-control border bg-surface px-3 font-normal text-ink focus-visible:outline-2 focus-visible:outline-brand-deep focus-visible:outline-offset-2" /></label>
      <label className="text-sm font-semibold text-ink">To<input type="date" name="to" defaultValue={to} className="mt-1 min-h-11 w-full rounded-control border bg-surface px-3 font-normal text-ink focus-visible:outline-2 focus-visible:outline-brand-deep focus-visible:outline-offset-2" /></label>
      <div className="sm:col-span-2 xl:col-span-5"><button type="submit" className="min-h-11 rounded-control bg-brand px-4 font-semibold text-ink hover:bg-brand-deep focus-visible:outline-2 focus-visible:outline-brand-deep focus-visible:outline-offset-2">Apply filters</button></div>
    </form>
    <DataTable
      pathname="/admin/activity"
      query={{ q, user, action, entity, from, to }}
      page={result.page}
      pageCount={result.pageCount}
      searchPlaceholder="Search action, entity, or summary"
      rows={result.rows}
      columns={[
        { key: "createdAt", header: "When", render: (row) => <time dateTime={row.createdAt.toISOString()}>{row.createdAt.toLocaleString("en-IN")}</time> },
        { key: "user", header: "User", render: (row) => row.user ? <span className="text-ink">{row.user.name}<span className="block text-xs text-ink-muted">{row.user.email}</span></span> : <span className="text-ink-muted">System / anonymous</span> },
        { key: "action", header: "Action", render: (row) => <Badge variant={row.action.endsWith("failed") ? "danger" : "neutral"}>{row.action}</Badge> },
        { key: "entityType", header: "Entity", render: (row) => <span>{row.entityType}{row.entityId ? <span className="block text-xs text-ink-muted">{row.entityId}</span> : null}</span> },
        { key: "summary", header: "Summary", render: (row) => <span>{row.summary ?? "—"}{row.diff ? <pre className="mt-2 max-w-[24rem] whitespace-pre-wrap break-words text-xs text-ink-muted">{JSON.stringify(row.diff)}</pre> : null}</span> },
      ]}
    />
  </div>;
}
