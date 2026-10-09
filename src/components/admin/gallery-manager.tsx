"use client";

import { useState } from "react";

import { bulkAddGallery, deleteGallery, reorderGallery, updateGallery } from "@/app/(admin)/admin/(protected)/gallery/actions";
import { CloudImage } from "@/components/cloud-image";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { MediaPicker, type MediaPickerAsset } from "@/components/admin/media-picker";
import { Button, Checkbox, Input } from "@/components/ui";
import type { GalleryItemView } from "@/server/services/gallery";

export function GalleryManager({ initialItems, assets }: { initialItems: GalleryItemView[]; assets: readonly MediaPickerAsset[] }) {
  const [items, setItems] = useState(initialItems);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [category, setCategory] = useState("construction");
  const [title, setTitle] = useState("");
  const [visible, setVisible] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function addSelected() {
    setBusy(true);
    const result = await bulkAddGallery({ mediaIds: selectedIds, category, title, isVisible: visible });
    setBusy(false);
    if (!result.ok) { setMessage(result.error.message); return; }
    setItems(result.data);
    setSelectedIds([]);
    setMessage(`${selectedIds.length} selected media item${selectedIds.length === 1 ? "" : "s"} added to the gallery.`);
  }

  async function saveItem(item: GalleryItemView, next: { category: string; title: string; isVisible: boolean }) {
    setBusy(true);
    const result = await updateGallery({ id: item.id, mediaId: item.mediaId, category: next.category, title: next.title, sortOrder: item.sortOrder, isVisible: next.isVisible });
    setBusy(false);
    if (!result.ok) { setMessage(result.error.message); return; }
    setItems((current) => current.map((entry) => entry.id === item.id ? result.data : entry));
    setMessage("Gallery item saved.");
  }

  async function move(item: GalleryItemView, direction: "up" | "down") {
    setBusy(true);
    const result = await reorderGallery({ id: item.id, direction });
    setBusy(false);
    if (!result.ok) { setMessage(result.error.message); return; }
    setItems(result.data);
  }

  async function remove(item: GalleryItemView) {
    setBusy(true);
    const result = await deleteGallery({ id: item.id });
    setBusy(false);
    if (!result.ok) { setMessage(result.error.message); return; }
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    setMessage("Gallery item removed. The media asset remains in the library.");
  }

  return <div className="space-y-8"><section className="rounded-card border bg-surface p-5 shadow-soft"><h2 className="font-heading text-lg font-semibold">Add from media library</h2><p className="mt-1 text-sm text-ink-muted">Select multiple images or videos and add them in one operation. Existing gallery references are skipped safely.</p><div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"><MediaPicker assets={assets} value={selectedIds} onChange={(value) => setSelectedIds(Array.isArray(value) ? value : value ? [value] : [])} multiple label="Media to add" /><div className="space-y-4"><label className="block text-sm font-semibold">Category<Input value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1" placeholder="waterproofing" /></label><label className="block text-sm font-semibold">Title (optional)<Input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1" /></label><label className="flex items-center gap-3 text-sm font-semibold"><Checkbox checked={visible} onChange={(event) => setVisible(event.target.checked)} /> Visible publicly</label><Button type="button" onClick={() => void addSelected()} disabled={busy || selectedIds.length === 0}>Add selected ({selectedIds.length})</Button></div></div></section>{message ? <p role="status" className="rounded-control border border-brand-deep/40 bg-brand/10 p-3 text-sm text-ink">{message}</p> : null}{items.length === 0 ? <div className="rounded-card border border-dashed p-10 text-center"><p className="font-semibold">No gallery items yet</p><p className="mt-2 text-sm text-ink-muted">Choose media above to create the first gallery items.</p></div> : <div className="space-y-4">{items.map((item, index) => <GalleryItemEditor key={item.id} item={item} index={index} total={items.length} busy={busy} onSave={saveItem} onMove={move} onDelete={remove} />)}</div>}</div>;
}

function GalleryItemEditor({ item, index, total, busy, onSave, onMove, onDelete }: { item: GalleryItemView; index: number; total: number; busy: boolean; onSave: (item: GalleryItemView, next: { category: string; title: string; isVisible: boolean }) => Promise<void>; onMove: (item: GalleryItemView, direction: "up" | "down") => Promise<void>; onDelete: (item: GalleryItemView) => Promise<void> }) {
  const [category, setCategory] = useState(item.category);
  const [title, setTitle] = useState(item.title ?? "");
  const [visible, setVisible] = useState(item.isVisible);
  return <article className="rounded-card border bg-surface p-4 shadow-soft"><div className="grid gap-4 md:grid-cols-[9rem_minmax(0,1fr)]"><div className="aspect-square overflow-hidden rounded-control bg-surface-alt">{item.media?.kind === "IMAGE" ? <CloudImage src={item.media.url} alt={item.media.alt} width={240} height={240} sizes="144px" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm font-semibold text-ink-muted">{item.media?.kind ?? "Missing media"}</div>}</div><div><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{item.media?.alt || item.mediaId}</p><p className="text-xs text-ink-muted">Order {index + 1} · {item.media?.kind ?? "Missing media"}</p></div><div className="flex gap-1"><Button type="button" size="sm" variant="ghost" disabled={busy || index === 0} onClick={() => void onMove(item, "up")} aria-label="Move gallery item up">↑</Button><Button type="button" size="sm" variant="ghost" disabled={busy || index === total - 1} onClick={() => void onMove(item, "down")} aria-label="Move gallery item down">↓</Button></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">Category<Input value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1" /></label><label className="text-sm font-semibold">Title<Input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1" /></label></div><label className="mt-3 flex items-center gap-3 text-sm font-semibold"><Checkbox checked={visible} onChange={(event) => setVisible(event.target.checked)} /> Visible publicly</label><div className="mt-4 flex flex-wrap gap-2"><Button type="button" size="sm" disabled={busy} onClick={() => void onSave(item, { category, title, isVisible: visible })}>Save</Button><ConfirmDialog title="Remove gallery item?" description="This removes the gallery entry but keeps the media asset in the library." confirmLabel="Remove" onConfirm={() => onDelete(item)}><Button type="button" size="sm" variant="ghost" className="text-danger" disabled={busy}>Remove</Button></ConfirmDialog></div></div></div></article>;
}

