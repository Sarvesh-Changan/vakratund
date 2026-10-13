"use client";

import { Play } from "lucide-react";

import { CloudImage } from "@/components/cloud-image";
import { CloudVideoPoster } from "@/components/cloud-video-poster";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button, Checkbox, Input, Select } from "@/components/ui";
import type { GalleryCategoryView, GalleryItemView } from "@/server/services/gallery";

type ItemChanges = Pick<GalleryItemView, "title" | "categoryId" | "designType" | "sortOrder">;
type Flag = "isCategoryCover" | "isFeatured" | "isPublished";

export function GalleryImageCard({ item, categories, index, total, busy, onSave, onToggle, onMove, onDelete }: { item: GalleryItemView; categories: GalleryCategoryView[]; index: number; total: number; busy: boolean; onSave: (item: GalleryItemView, changes: ItemChanges) => Promise<void>; onToggle: (item: GalleryItemView, flag: Flag, value: boolean) => Promise<void>; onMove: (item: GalleryItemView, direction: "up" | "down") => Promise<void>; onDelete: (item: GalleryItemView) => Promise<void> }) {
  return <article className="overflow-hidden rounded-card border bg-surface shadow-soft"><div className="relative aspect-[4/3] bg-surface-alt">{item.mediaType === "VIDEO" ? <CloudVideoPoster src={item.url} alt={`Video poster: ${item.title}`} fill sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw" className="object-cover" /> : <CloudImage src={item.url} alt={item.title} fill sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw" className="object-cover" />}{item.mediaType === "VIDEO" ? <span className="absolute inset-0 flex items-center justify-center bg-charcoal/20"><span className="flex size-12 items-center justify-center rounded-full bg-charcoal/80 text-white" aria-label="Video"><Play size={22} fill="currentColor" aria-hidden="true" /></span></span> : null}<span className="absolute left-3 top-3 rounded-pill bg-charcoal/80 px-2 py-1 text-xs font-semibold text-white">{item.mediaType}</span></div><div className="space-y-4 p-4"><div><h3 className="font-semibold">{item.title}</h3><p className="mt-1 text-xs text-ink-muted">{item.category.name} · {item.designType.toLowerCase()} · {formatBytes(item.bytes)}</p></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold">Title<Input key={`title-${item.id}`} defaultValue={item.title} maxLength={160} className="mt-1 text-sm" id={`gallery-title-${item.id}`} /></label><label className="text-xs font-semibold">Category<Select key={`category-${item.id}`} defaultValue={item.categoryId} className="mt-1 text-sm" id={`gallery-category-${item.id}`}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></label><label className="text-xs font-semibold">Design type<Select key={`design-${item.id}`} defaultValue={item.designType} className="mt-1 text-sm" id={`gallery-design-${item.id}`}><option value="INTERIOR">Interior</option><option value="EXTERIOR">Exterior</option></Select></label><label className="text-xs font-semibold">Sort order<Input key={`order-${item.id}`} type="number" min={0} max={100000} defaultValue={item.sortOrder} className="mt-1 text-sm" id={`gallery-order-${item.id}`} /></label></div><div className="grid gap-2 sm:grid-cols-3"><FlagToggle label="Category cover" checked={item.isCategoryCover} disabled={busy} onChange={(value) => void onToggle(item, "isCategoryCover", value)} /><FlagToggle label="Featured" checked={item.isFeatured} disabled={busy} onChange={(value) => void onToggle(item, "isFeatured", value)} /><FlagToggle label="Published" checked={item.isPublished} disabled={busy} onChange={(value) => void onToggle(item, "isPublished", value)} /></div><div className="flex flex-wrap gap-2"><Button type="button" size="sm" disabled={busy} onClick={() => void onSave(item, { title: readValue(`gallery-title-${item.id}`), categoryId: readValue(`gallery-category-${item.id}`), designType: readValue(`gallery-design-${item.id}`) as GalleryItemView["designType"], sortOrder: Number(readValue(`gallery-order-${item.id}`)) })}>Save details</Button><Button type="button" size="sm" variant="secondary" disabled={busy || index === 0} aria-label={`Move ${item.title} up`} onClick={() => void onMove(item, "up")}>↑</Button><Button type="button" size="sm" variant="secondary" disabled={busy || index === total - 1} aria-label={`Move ${item.title} down`} onClick={() => void onMove(item, "down")}>↓</Button><ConfirmDialog title="Delete gallery item?" description="This removes the gallery item. Its Cloudinary asset is deleted only when it is not referenced elsewhere; any cleanup failure will be reported." confirmLabel="Delete item" onConfirm={() => onDelete(item)}><Button type="button" size="sm" variant="ghost" className="text-danger" disabled={busy}>Delete</Button></ConfirmDialog></div></div></article>;
}

function FlagToggle({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex min-h-11 items-center gap-2 text-xs font-semibold"><Checkbox checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}

function readValue(id: string): string {
  const element = document.getElementById(id);
  return element instanceof HTMLInputElement || element instanceof HTMLSelectElement ? element.value : "";
}

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
