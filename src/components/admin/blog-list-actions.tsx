"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteBlogPost, togglePublish } from "@/app/(admin)/admin/(protected)/blog/actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui";
import type { BlogPostView } from "@/server/services/blog";

export function BlogListActions({ post }: { post: BlogPostView }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [message, setMessage] = useState<string | null>(null);
  async function run(action: () => Promise<{ ok: boolean; error?: { message: string } }>) { setBusy(true); setMessage(null); const result = await action(); setBusy(false); if (!result.ok) setMessage(result.error?.message ?? "The action failed."); else router.refresh(); }
  return <div className="flex flex-wrap items-center gap-2"><Link href={`/admin/blog/${post.id}/edit`}><Button type="button" size="sm" variant="secondary">Edit</Button></Link><Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => void run(() => togglePublish({ id: post.id, published: post.status !== "PUBLISHED" }))}>{post.status === "PUBLISHED" ? "Unpublish" : "Publish"}</Button><ConfirmDialog title="Delete blog post?" description="This permanently removes the post and its content." confirmLabel="Delete" onConfirm={() => run(() => deleteBlogPost({ id: post.id }))}><Button type="button" size="sm" variant="ghost" className="text-danger" disabled={busy}>Delete</Button></ConfirmDialog>{message ? <span role="alert" className="basis-full text-xs text-danger">{message}</span> : null}</div>;
}
