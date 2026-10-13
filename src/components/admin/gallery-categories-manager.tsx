"use client";

import { useState } from "react";

import { createGalleryCategory, deleteGalleryCategory, reorderGalleryCategory, updateGalleryCategory } from "@/app/(admin)/admin/(protected)/gallery/actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button, Input } from "@/components/ui";
import type { GalleryCategoryView } from "@/server/services/gallery";

const dateFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

export function GalleryCategoriesManager({ categories, onReload }: { categories: GalleryCategoryView[]; onReload: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    const result = await createGalleryCategory({ name, sortOrder: categories.length });
    setBusy(false);
    if (!result.ok) { setMessage(result.error.message); return; }
    setName("");
    setMessage(`Created ${result.data.name}.`);
    await onReload();
  }

  async function save(category: GalleryCategoryView, nextName: string, sortOrder: number): Promise<void> {
    setBusy(true);
    const result = await updateGalleryCategory({ id: category.id, name: nextName, sortOrder });
    setBusy(false);
    if (!result.ok) { setMessage(result.error.message); return; }
    setMessage(`Saved ${result.data.name}.`);
    await onReload();
  }

  async function remove(category: GalleryCategoryView): Promise<void> {
    setBusy(true);
    const result = await deleteGalleryCategory({ id: category.id });
    setBusy(false);
    if (!result.ok) { setMessage(result.error.message); return; }
    const { deletedItems, cleanupFailures } = result.data;
    setMessage(cleanupFailures > 0 ? `Deleted category and ${deletedItems} item(s). ${cleanupFailures} Cloudinary file(s) failed cleanup; see server logs and retry from the unused media library.` : `Deleted category and ${deletedItems} item(s); Cloudinary assets were removed where unused.`);
    await onReload();
  }

  async function move(category: GalleryCategoryView, direction: "up" | "down"): Promise<void> {
    setBusy(true);
    const result = await reorderGalleryCategory({ id: category.id, direction });
    setBusy(false);
    if (!result.ok) { setMessage(result.error.message); return; }
    await onReload();
  }

  return <div className="space-y-5"><form onSubmit={(event) => void create(event)} className="flex flex-col gap-3 rounded-card border bg-surface p-4 sm:flex-row sm:items-end"><label className="flex-1 text-sm font-semibold">New category<Input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required className="mt-1" placeholder="e.g. Waterproofing" /></label><Button type="submit" loading={busy} disabled={!name.trim()}>Add category</Button></form>{message ? <p role="status" className="rounded-control border border-brand-deep/40 bg-brand/10 p-3 text-sm">{message}</p> : null}{categories.length === 0 ? <div className="rounded-card border border-dashed p-8 text-center"><p className="font-semibold">No gallery categories yet</p><p className="mt-2 text-sm text-ink-muted">Create a category before adding images.</p></div> : <div className="space-y-3">{categories.map((category, index) => <CategoryRow key={category.id} category={category} index={index} total={categories.length} busy={busy} onSave={save} onMove={move} onDelete={remove} />)}</div>}</div>;
}

function CategoryRow({ category, index, total, busy, onSave, onMove, onDelete }: { category: GalleryCategoryView; index: number; total: number; busy: boolean; onSave: (category: GalleryCategoryView, name: string, sortOrder: number) => Promise<void>; onMove: (category: GalleryCategoryView, direction: "up" | "down") => Promise<void>; onDelete: (category: GalleryCategoryView) => Promise<void> }) {
  const [name, setName] = useState(category.name);
  const [sortOrder, setSortOrder] = useState(category.sortOrder);
  return <article className="grid gap-4 rounded-card border bg-surface p-4 md:grid-cols-[minmax(0,1fr)_9rem_auto]"><label className="text-sm font-semibold">Category name<Input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} className="mt-1" /></label><label className="text-sm font-semibold">Sort order<Input type="number" min={0} max={100000} value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value))} className="mt-1" /></label><div className="flex flex-wrap items-end gap-2"><Button type="button" size="sm" variant="secondary" disabled={busy || index === 0} onClick={() => void onMove(category, "up")} aria-label={`Move ${category.name} up`}>↑</Button><Button type="button" size="sm" variant="secondary" disabled={busy || index === total - 1} onClick={() => void onMove(category, "down")} aria-label={`Move ${category.name} down`}>↓</Button><Button type="button" size="sm" disabled={busy || !name.trim()} onClick={() => void onSave(category, name, sortOrder)}>Save</Button><ConfirmDialog title="Delete category?" description={`This permanently deletes ${category.imageCount} image/video item(s) in “${category.name}”. Cloudinary files are removed when they are not used elsewhere.`} confirmLabel="Delete category" onConfirm={() => onDelete(category)}><Button type="button" size="sm" variant="ghost" className="text-danger" disabled={busy}>Delete</Button></ConfirmDialog></div><p className="text-xs text-ink-muted md:col-span-3">Created {dateFormatter.format(new Date(category.createdAt))} · {category.imageCount} image/video item{category.imageCount === 1 ? "" : "s"}</p></article>;
}
