"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteTestimonial, reorderTestimonials, togglePublish as toggleTestimonial } from "@/app/(admin)/admin/(protected)/testimonials/actions";
import { deleteFaq, reorderFaqs, togglePublish as toggleFaq } from "@/app/(admin)/admin/(protected)/faqs/actions";
import { deleteTeamMember, reorderTeamMembers, toggleVisibility } from "@/app/(admin)/admin/(protected)/team/actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui";
import type { FaqView } from "@/server/services/faqs";
import type { TeamMemberView } from "@/server/services/team";
import type { TestimonialView } from "@/server/services/testimonials";

type Result = { ok: boolean; error?: { message: string } };

function useContentActions() {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [message, setMessage] = useState<string | null>(null);
  async function run(action: () => Promise<Result>) { setBusy(true); setMessage(null); const result = await action(); setBusy(false); if (!result.ok) setMessage(result.error?.message ?? "The action failed."); else router.refresh(); }
  return { busy, message, run };
}

export function TestimonialListActions({ item, canMoveUp, canMoveDown }: { item: TestimonialView; canMoveUp: boolean; canMoveDown: boolean }) {
  const { busy, message, run } = useContentActions();
  return <div className="flex flex-wrap items-center gap-2"><Link href={`/admin/testimonials/${item.id}/edit`}><Button type="button" size="sm" variant="secondary">Edit</Button></Link><Button type="button" size="sm" variant="ghost" disabled={busy || !canMoveUp} onClick={() => void run(() => reorderTestimonials({ id: item.id, direction: "up" }))} aria-label={`Move ${item.name} up`}>↑</Button><Button type="button" size="sm" variant="ghost" disabled={busy || !canMoveDown} onClick={() => void run(() => reorderTestimonials({ id: item.id, direction: "down" }))} aria-label={`Move ${item.name} down`}>↓</Button><Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => void run(() => toggleTestimonial({ id: item.id, published: item.status !== "PUBLISHED" }))}>{item.status === "PUBLISHED" ? "Unpublish" : "Publish"}</Button><ConfirmDialog title="Delete testimonial?" description="This permanently removes the testimonial." confirmLabel="Delete" onConfirm={() => run(() => deleteTestimonial({ id: item.id }))}><Button type="button" size="sm" variant="ghost" className="text-danger" disabled={busy}>Delete</Button></ConfirmDialog>{message ? <span className="basis-full text-xs text-danger" role="alert">{message}</span> : null}</div>;
}

export function FaqListActions({ item, canMoveUp, canMoveDown }: { item: FaqView; canMoveUp: boolean; canMoveDown: boolean }) {
  const { busy, message, run } = useContentActions();
  return <div className="flex flex-wrap items-center gap-2"><Link href={`/admin/faqs/${item.id}/edit`}><Button type="button" size="sm" variant="secondary">Edit</Button></Link><Button type="button" size="sm" variant="ghost" disabled={busy || !canMoveUp} onClick={() => void run(() => reorderFaqs({ id: item.id, direction: "up" }))} aria-label={`Move FAQ up`}>↑</Button><Button type="button" size="sm" variant="ghost" disabled={busy || !canMoveDown} onClick={() => void run(() => reorderFaqs({ id: item.id, direction: "down" }))} aria-label="Move FAQ down">↓</Button><Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => void run(() => toggleFaq({ id: item.id, published: item.status !== "PUBLISHED" }))}>{item.status === "PUBLISHED" ? "Unpublish" : "Publish"}</Button><ConfirmDialog title="Delete FAQ?" description="This permanently removes the FAQ." confirmLabel="Delete" onConfirm={() => run(() => deleteFaq({ id: item.id }))}><Button type="button" size="sm" variant="ghost" className="text-danger" disabled={busy}>Delete</Button></ConfirmDialog>{message ? <span className="basis-full text-xs text-danger" role="alert">{message}</span> : null}</div>;
}

export function TeamListActions({ item, canMoveUp, canMoveDown }: { item: TeamMemberView; canMoveUp: boolean; canMoveDown: boolean }) {
  const { busy, message, run } = useContentActions();
  return <div className="flex flex-wrap items-center gap-2"><Link href={`/admin/team/${item.id}/edit`}><Button type="button" size="sm" variant="secondary">Edit</Button></Link><Button type="button" size="sm" variant="ghost" disabled={busy || !canMoveUp} onClick={() => void run(() => reorderTeamMembers({ id: item.id, direction: "up" }))} aria-label={`Move ${item.name} up`}>↑</Button><Button type="button" size="sm" variant="ghost" disabled={busy || !canMoveDown} onClick={() => void run(() => reorderTeamMembers({ id: item.id, direction: "down" }))} aria-label={`Move ${item.name} down`}>↓</Button><Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => void run(() => toggleVisibility({ id: item.id, visible: !item.isVisible }))}>{item.isVisible ? "Hide" : "Publish"}</Button><ConfirmDialog title="Delete team member?" description="This removes the member from the team." confirmLabel="Delete" onConfirm={() => run(() => deleteTeamMember({ id: item.id }))}><Button type="button" size="sm" variant="ghost" className="text-danger" disabled={busy}>Delete</Button></ConfirmDialog>{message ? <span className="basis-full text-xs text-danger" role="alert">{message}</span> : null}</div>;
}
