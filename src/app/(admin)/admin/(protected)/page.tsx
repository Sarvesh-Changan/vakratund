import Link from "next/link";

import { PageHeader } from "@/components/admin";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import { isRole } from "@/config/permissions";
import { Card, EmptyState, Stat } from "@/components/ui";
import { requirePermission, requireSession } from "@/lib/auth/session";
import { getDashboardData } from "@/server/services/dashboard";
import { redirect } from "next/navigation";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function formatType(value: string): string {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: Date): string {
  return value.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="rounded-control border bg-surface px-4 py-3 text-sm font-semibold text-ink hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-brand-deep focus-visible:outline-offset-2">{label}</Link>;
}

function List({ entries, empty }: { entries: readonly { label: string; count: number }[]; empty: string }) {
  return entries.length === 0 ? <p className="mt-3 text-sm text-ink-muted">{empty}</p> : <ul className="mt-3 divide-y">{entries.map((entry) => <li key={entry.label} className="flex justify-between gap-3 py-3 text-sm"><span className="truncate text-ink">{entry.label}</span><span className="font-semibold text-brand-deep">{entry.count}</span></li>)}</ul>;
}

export default async function AdminDashboardPage() {
  const session = await requireSession();
  if (!isRole(session.user.role)) redirect("/admin/login");
  if (session.user.role === "EDITOR") await requirePermission("dashboard:content");
  else await requirePermission("dashboard:leads");
  const data = await getDashboardData(session.user.role);

  if (data.kind === "content") return <div className="space-y-8">
    <PageHeader eyebrow="Administration" title="Dashboard" description="A focused view of the publishing workspace." />
    <div className="grid gap-4 sm:grid-cols-2"><Stat label="Published content" value={data.publishedCount} detail="Services and projects" /><Stat label="Draft content" value={data.draftCount} detail="Items awaiting review" /></div>
    <div className="flex flex-wrap gap-3"><QuickAction href="/admin/services" label="Manage services" /><QuickAction href="/admin/projects" label="Manage projects" /></div>
    {data.publishedCount + data.draftCount === 0 ? <EmptyState title="No content yet" description="Published and draft content statistics will appear here once editorial records exist." /> : null}
  </div>;

  const hasLeads = data.kpis.newLast30Days > 0 || data.recentLeads.length > 0;
  return <div className="space-y-8">
    <PageHeader eyebrow="Administration" title="Dashboard" description="Lead and quote activity across the last 30 days." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><Stat label="New leads today" value={data.kpis.newToday} /><Stat label="New leads · 7 days" value={data.kpis.newLast7Days} /><Stat label="New leads · 30 days" value={data.kpis.newLast30Days} /><Stat label="Conversion rate" value={`${Math.round(data.kpis.conversionRate * 100)}%`} detail="Converted / new leads, last 30 days" /><Stat label="Quotes" value={data.kpis.quoteCount} /><Stat label="Estimated value range" value={`${currency.format(data.kpis.estimatedLowTotal)} – ${currency.format(data.kpis.estimatedHighTotal)}`} detail="Stored quote ranges" /></div>
    {!hasLeads ? <EmptyState title="No leads yet" description="New enquiries will populate the dashboard as soon as the first lead is received." /> : null}
    <DashboardCharts leadsByDay={data.leadsByDay} leadsByStatus={data.leadsByStatus} />
    <div className="grid gap-6 xl:grid-cols-3">
      <Card><h2 className="text-lg font-semibold text-ink">Top source pages</h2><List entries={data.leadsBySourcePage} empty="No source page data" /></Card>
      <Card><h2 className="text-lg font-semibold text-ink">Lead types</h2><List entries={data.leadsByType.map((entry) => ({ ...entry, label: formatType(entry.label) }))} empty="No lead type data" /></Card>
      <Card><h2 className="text-lg font-semibold text-ink">Recent leads</h2>{data.recentLeads.length === 0 ? <p className="mt-3 text-sm text-ink-muted">No recent leads.</p> : <ul className="mt-3 divide-y">{data.recentLeads.map((lead) => <li key={lead.id} className="flex items-start justify-between gap-3 py-3 text-sm"><span><span className="block font-semibold text-ink">{lead.name}</span><span className="block text-ink-muted">{formatType(lead.type)} · {formatType(lead.status)}</span></span><time className="shrink-0 text-xs text-ink-muted" dateTime={lead.createdAt.toISOString()}>{formatDate(lead.createdAt)}</time></li>)}</ul>}</Card>
    </div>
    <div className="flex flex-wrap gap-3"><QuickAction href="/admin/leads" label="View leads" /><QuickAction href="/admin/quotes" label="View quotes" /><QuickAction href="/admin/estimator" label="Estimator settings" /></div>
  </div>;
}
