"use client";

import { useState } from "react";

import { CloudImage } from "@/components/cloud-image";
import { SectionUploader } from "@/components/admin/section-uploader";
import { MediaPicker, type MediaPickerAsset } from "@/components/admin/media-picker";
import { Button, Checkbox } from "@/components/ui";
import type { ProjectMediaInput } from "@/lib/validation/projects";

function reorder(items: readonly ProjectMediaInput[], from: number, to: number): ProjectMediaInput[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (!item) return next;
  next.splice(to, 0, item);
  return next.map((media, index) => ({ ...media, sortOrder: index }));
}

export function ProjectMediaEditor({ assets, value, onChange, error, entityTitle }: { assets: readonly MediaPickerAsset[]; value: readonly ProjectMediaInput[]; onChange: (value: ProjectMediaInput[]) => void; error?: string; entityTitle: string }) {
  const [availableAssets, setAvailableAssets] = useState<MediaPickerAsset[]>([...assets]);
  const selectedIds = value.map((item) => item.mediaId);
  const assetById = new Map(availableAssets.map((asset) => [asset.id, asset]));

  function selectMedia(next: string | string[] | null): void {
    const ids = Array.isArray(next) ? next : next ? [next] : [];
    const existing = new Map(value.map((item) => [item.mediaId, item]));
    onChange(ids.map((mediaId, index) => existing.get(mediaId) ?? { mediaId, isCover: index === 0, isBefore: false, isAfter: false, sortOrder: index }));
  }

  function updateFlag(index: number, flag: "isCover" | "isBefore" | "isAfter", checked: boolean): void {
    onChange(value.map((item, itemIndex) => itemIndex === index ? { ...item, [flag]: checked } : item));
  }

  function move(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    onChange(reorder(value, index, target));
  }

  function addUploadedAsset(asset: MediaPickerAsset): void {
    setAvailableAssets((current) => [...current, asset]);
    const hasCover = value.some((item) => item.isCover);
    onChange([...value, { mediaId: asset.id, isCover: !hasCover, isBefore: false, isAfter: false, sortOrder: value.length }]);
  }

  return <div className="space-y-4"><SectionUploader section="projects" multiple defaultAlt={entityTitle} onUploaded={addUploadedAsset} title="Project gallery upload" /><MediaPicker assets={availableAssets} value={selectedIds} onChange={selectMedia} multiple label="Project media" /><p className="text-sm text-ink-muted">Select one or more images or videos, then mark the cover and before/after roles. Drag cards to change the public gallery order; the arrow buttons are available for keyboard users.</p>{error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}<div className="space-y-3" aria-live="polite">{value.map((item, index) => { const asset = assetById.get(item.mediaId); if (!asset) return null; return <article key={item.mediaId} draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const from = Number(event.dataTransfer.getData("text/plain")); if (Number.isInteger(from)) onChange(reorder(value, from, index)); }} className="rounded-control border bg-surface p-3"><div className="flex flex-wrap items-start gap-3"><div className="size-20 overflow-hidden rounded-control bg-surface-alt">{asset.kind === "IMAGE" ? <CloudImage src={asset.url} alt={asset.alt} width={80} height={80} sizes="80px" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs font-semibold text-ink-muted">{asset.kind}</div>}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{asset.publicId}</p><p className="mt-1 text-xs text-ink-muted">Order {index + 1} · {asset.alt}</p><div className="mt-3 flex flex-wrap gap-4 text-sm"><label className="flex items-center gap-2"><Checkbox checked={item.isCover} onChange={(event) => updateFlag(index, "isCover", event.target.checked)} /> Cover</label><label className="flex items-center gap-2"><Checkbox checked={item.isBefore} onChange={(event) => updateFlag(index, "isBefore", event.target.checked)} /> Before</label><label className="flex items-center gap-2"><Checkbox checked={item.isAfter} onChange={(event) => updateFlag(index, "isAfter", event.target.checked)} /> After</label></div></div><div className="flex gap-1"><Button type="button" size="sm" variant="secondary" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${asset.publicId} up`}>↑</Button><Button type="button" size="sm" variant="secondary" onClick={() => move(index, 1)} disabled={index === value.length - 1} aria-label={`Move ${asset.publicId} down`}>↓</Button></div></div></article>; })}</div></div>;
}
