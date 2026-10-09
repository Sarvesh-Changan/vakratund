"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { deleteProject, reorderProjects, togglePublish } from "@/app/(admin)/admin/(protected)/projects/actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui";
import type { ProjectView } from "@/server/services/projects";

export function ProjectListActions({ project, canMoveUp, canMoveDown }: { project: ProjectView; canMoveUp: boolean; canMoveDown: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<{ ok: boolean; error?: { message: string } }>) {
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (!result.ok) { setMessage(result.error?.message ?? "The action failed."); return; }
    router.refresh();
  }

  return <div className="flex flex-wrap items-center gap-2"><Link href={`/admin/projects/${project.id}/edit`}><Button type="button" size="sm" variant="secondary">Edit</Button></Link><Button type="button" size="sm" variant="ghost" disabled={busy || !canMoveUp} onClick={() => void run(() => reorderProjects({ id: project.id, direction: "up" }))} aria-label={`Move ${project.title} up`}>↑</Button><Button type="button" size="sm" variant="ghost" disabled={busy || !canMoveDown} onClick={() => void run(() => reorderProjects({ id: project.id, direction: "down" }))} aria-label={`Move ${project.title} down`}>↓</Button><Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => void run(() => togglePublish({ id: project.id, published: project.publishStatus !== "PUBLISHED" }))}>{project.publishStatus === "PUBLISHED" ? "Unpublish" : "Publish"}</Button><ConfirmDialog title="Delete project?" description="This removes the project and its media attachments. Media assets themselves remain in the library." confirmLabel="Delete" onConfirm={() => run(() => deleteProject({ id: project.id }))}><Button type="button" size="sm" variant="ghost" className="text-danger" disabled={busy}>Delete</Button></ConfirmDialog>{message ? <span className="basis-full text-xs text-danger" role="alert">{message}</span> : null}</div>;
}

