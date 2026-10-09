"use client";

import { CloudImage } from "@/components/cloud-image";
import { cn } from "@/lib/utils";

export type MediaPickerAsset = {
  id: string;
  kind: "IMAGE" | "VIDEO" | "DOCUMENT";
  url: string;
  publicId: string;
  alt: string;
};

export function MediaPicker({ assets, value, onChange, multiple = false, label = "Select media" }: { assets: readonly MediaPickerAsset[]; value: string | readonly string[] | null; onChange: (value: string | string[] | null) => void; multiple?: boolean; label?: string }) {
  const selected = new Set(Array.isArray(value) ? value : value ? [value] : []);
  function toggle(id: string) {
    if (multiple) {
      const next = selected.has(id) ? [...selected].filter((item) => item !== id) : [...selected, id];
      onChange(next);
    } else {
      onChange(selected.has(id) ? null : id);
    }
  }

  return <fieldset className="space-y-3"><legend className="text-sm font-semibold text-ink">{label}</legend>{assets.length === 0 ? <p className="rounded-control border border-dashed p-4 text-sm text-ink-muted">No media assets are available yet.</p> : <div className="grid max-h-80 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">{assets.map((asset) => { const isSelected = selected.has(asset.id); return <label key={asset.id} className={cn("cursor-pointer rounded-control border p-2 transition-colors", isSelected ? "border-brand-deep bg-brand/10" : "hover:bg-surface-alt")}><input type={multiple ? "checkbox" : "radio"} name={label} checked={isSelected} onChange={() => toggle(asset.id)} className="sr-only" />{asset.kind === "IMAGE" ? <CloudImage src={asset.url} alt={asset.alt} width={240} height={160} sizes="(max-width: 640px) 45vw, 160px" className="aspect-[4/3] w-full rounded-control object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center rounded-control bg-surface-alt text-xs font-semibold text-ink-muted">{asset.kind}</div>}<span className="mt-2 block truncate text-xs font-semibold text-ink">{asset.publicId}</span></label>; })}</div>}</fieldset>;
}
