"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteService, reorderServices, togglePublish } from "@/app/(admin)/admin/(protected)/services/actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui";
import { ServiceIcon } from "@/components/admin/service-icon";
import type { ServiceView } from "@/server/services/services";

export function ServiceListActions({ service, canMoveUp, canMoveDown }: { service: ServiceView; canMoveUp: boolean; canMoveDown: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: () => Promise<{ ok: boolean; error?: { message: string } }>) {
    setBusy(true);
    setMessage(null);
    const result = await action();
    setBusy(false);
    if (!result.ok) setMessage(result.error?.message ?? "The action failed.");
    else router.refresh();
  }

  return <div className="flex flex-wrap items-center gap-2"><Link href={`/admin/services/${service.id}/edit`} className="rounded-control border px-3 py-2 text-sm font-semibold hover:bg-surface-alt">Edit</Link><Button type="button" size="sm" variant="secondary" disabled={busy || !canMoveUp} onClick={() => void run(() => reorderServices({ id: service.id, direction: "up" }))} aria-label={`Move ${service.title} up`}>↑</Button><Button type="button" size="sm" variant="secondary" disabled={busy || !canMoveDown} onClick={() => void run(() => reorderServices({ id: service.id, direction: "down" }))} aria-label={`Move ${service.title} down`}>↓</Button><Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => void run(() => togglePublish({ id: service.id, published: service.status !== "PUBLISHED" }))}>{service.status === "PUBLISHED" ? "Unpublish" : "Publish"}</Button><ConfirmDialog title="Delete this service?" description="This permanently removes the service and disconnects it from related content. This cannot be undone." confirmLabel="Delete service" onConfirm={() => run(() => deleteService({ id: service.id }))}><Button type="button" size="sm" variant="ghost" disabled={busy} className="text-danger">Delete</Button></ConfirmDialog>{message ? <span role="alert" className="basis-full text-xs text-danger">{message}</span> : null}</div>;
}

export function ServiceListIcon({ service }: { service: ServiceView }) {
  return <span className="flex size-10 items-center justify-center rounded-control bg-brand/15 text-brand-deep"><ServiceIcon iconKey={service.iconKey} /></span>;
}
