import Link from "next/link";

import { PageHeader, ServiceListActions, ServiceListIcon } from "@/components/admin";
import { Badge, Button, EmptyState, Select } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { listServices } from "@/server/services/services";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined { return Array.isArray(value) ? value[0] : value; }

export default async function ServicesPage({ searchParams }: { searchParams: SearchParams }) {
  await requirePermission("content:write");
  const params = await searchParams;
  const q = first(params.q);
  const status = first(params.status);
  const services = await listServices({ q, status: status === "DRAFT" || status === "PUBLISHED" || status === "ARCHIVED" ? status : undefined });
  return <div className="space-y-6"><PageHeader title="Services" eyebrow="Content workspace" description="Manage service descriptions, scope, ordering, publication, media, and search appearance." action={<Link href="/admin/services/new"><Button>Add service</Button></Link>} /><form method="get" action="/admin/services" className="flex flex-col gap-3 rounded-card border bg-surface p-4 sm:flex-row"><label className="flex-1 text-sm font-semibold">Search<input name="q" defaultValue={q} placeholder="Search title or slug" className="mt-1 min-h-11 w-full rounded-control border bg-surface px-3 font-normal focus-visible:outline-2 focus-visible:outline-brand-deep" /></label><label className="text-sm font-semibold">Status<Select name="status" defaultValue={status ?? ""} className="mt-1 min-w-40"><option value="">All statuses</option><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></Select></label><Button type="submit" variant="secondary" className="self-end">Filter</Button></form>{services.length === 0 ? <EmptyState title="No services found" description={q || status ? "Try a different filter or add a new service." : "Create the first service to start building the public services page."} action={<Link href="/admin/services/new"><Button>Add service</Button></Link>} /> : <div className="overflow-x-auto rounded-card border bg-surface"><table className="w-full min-w-[64rem] text-left text-sm"><thead className="border-b bg-surface-alt text-ink-muted"><tr><th scope="col" className="px-4 py-3">Service</th><th scope="col" className="px-4 py-3">Status</th><th scope="col" className="px-4 py-3">Featured</th><th scope="col" className="px-4 py-3">Order</th><th scope="col" className="px-4 py-3">Actions</th></tr></thead><tbody className="divide-y">{services.map((service, index) => <tr key={service.id} className="hover:bg-surface-alt/60"><td className="px-4 py-4"><div className="flex items-center gap-3"><ServiceListIcon service={service} /><div><p className="font-semibold">{service.title}</p><p className="text-xs text-ink-muted">/{service.slug}</p></div></div></td><td className="px-4 py-4"><Badge variant={service.status === "PUBLISHED" ? "success" : service.status === "ARCHIVED" ? "danger" : "warning"}>{service.status}</Badge></td><td className="px-4 py-4">{service.isFeatured ? "Yes" : "No"}</td><td className="px-4 py-4">{service.sortOrder}</td><td className="px-4 py-4"><ServiceListActions service={service} canMoveUp={index > 0} canMoveDown={index < services.length - 1} /></td></tr>)}</tbody></table></div>}</div>;
}
