"use client";

import { useMemo, useState } from "react";

import { removeMediaAsset, updateMediaMetadata } from "@/app/(admin)/admin/(protected)/media/actions";
import { CloudImage } from "@/components/cloud-image";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { MediaUploader } from "@/components/admin/media-uploader";
import { Button, Input, Select } from "@/components/ui";
import type { MediaAssetView } from "@/server/services/media";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number | null): string { if (!bytes) return "—"; if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }

export function MediaLibrary({ initialAssets }: { initialAssets: MediaAssetView[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [message, setMessage] = useState<string | null>(null);
  const filtered = useMemo(() => assets.filter((asset) => (folder === "all" || asset.folder === folder) && [asset.publicId, asset.alt, asset.caption].join(" ").toLowerCase().includes(query.toLowerCase())), [assets, folder, query]);

  function addAsset(asset: MediaAssetView) { setAssets((current) => [asset, ...current]); }
  async function save(asset: MediaAssetView, alt: string, caption: string) { const result = await updateMediaMetadata({ id: asset.id, alt, caption: caption || undefined }); if (result.ok) { setAssets((current) => current.map((item) => item.id === asset.id ? result.data : item)); setMessage("Media metadata saved."); } else setMessage(result.error.message); }
  async function remove(asset: MediaAssetView) { const result = await removeMediaAsset({ id: asset.id }); if (result.ok && "blocked" in result.data && result.data.blocked) { setMessage(`${asset.publicId} is still used in: ${result.data.usages.map((usage) => `${usage.type}: ${usage.label}`).join(", ")}. Remove those references first.`); return; } if (result.ok) { setAssets((current) => current.filter((item) => item.id !== asset.id)); setMessage("Media asset deleted."); } else setMessage(result.error.message); }

  return <div className="space-y-6"><div className="flex flex-wrap gap-3"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search filename, alt text, caption" aria-label="Search media" className="min-w-64 flex-1" /><Select value={folder} onChange={(event) => setFolder(event.target.value)} aria-label="Filter media folder" className="w-auto min-w-36"><option value="all">All folders</option><option value="vakratund/projects">Projects</option><option value="vakratund/gallery">Gallery</option><option value="vakratund/blog">Blog</option><option value="vakratund/team">Team</option><option value="vakratund/docs">Docs</option></Select><div className="flex rounded-control border p-1"><Button type="button" variant={view === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setView("grid")}>Grid</Button><Button type="button" variant={view === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setView("list")}>List</Button></div></div>{message ? <p role="status" className="rounded-control border border-brand-deep/40 bg-brand/10 p-3 text-sm text-ink">{message}</p> : null}{filtered.length === 0 ? <div className="rounded-card border border-dashed p-10 text-center"><p className="font-semibold">No media assets found</p><p className="mt-2 text-sm text-ink-muted">Upload an asset or adjust your search and folder filter.</p></div> : <div className={cn(view === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-3")}>{filtered.map((asset) => <MediaCard key={asset.id} asset={asset} list={view === "list"} onSave={save} onRemove={remove} />)}</div>}<MediaPickerSummary assets={assets} onSelected={(id) => setMessage(`Selected media asset ${id}. Use MediaPicker in CMS forms to attach it.`)} /> <MediaLibraryUploader onSaved={addAsset} /></div>;
}

function MediaCard({ asset, list, onSave, onRemove }: { asset: MediaAssetView; list: boolean; onSave: (asset: MediaAssetView, alt: string, caption: string) => Promise<void>; onRemove: (asset: MediaAssetView) => Promise<void> }) {
  const [alt, setAlt] = useState(asset.alt);
  const [caption, setCaption] = useState(asset.caption ?? "");
  return <article className={cn("rounded-card border bg-surface p-4 shadow-soft", list && "flex flex-wrap items-start gap-4")}><div className={cn("overflow-hidden rounded-control bg-surface-alt", list ? "h-24 w-32 shrink-0" : "aspect-[4/3]")}>{asset.kind === "IMAGE" ? <CloudImage src={asset.url} alt={asset.alt} width={640} height={480} sizes="(max-width: 640px) 90vw, 30vw" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm font-semibold text-ink-muted">{asset.kind}</div>}</div><div className="min-w-0 flex-1"><div className="mt-3 flex items-start justify-between gap-3"><p className="truncate text-sm font-semibold" title={asset.publicId}>{asset.publicId}</p><span className="shrink-0 rounded-pill bg-surface-alt px-2 py-1 text-xs text-ink-muted">{formatBytes(asset.bytes)}</span></div><p className="mt-1 text-xs text-ink-muted">{asset.folder} · {asset.usageCount} reference{asset.usageCount === 1 ? "" : "s"}</p><label className="mt-3 block text-xs font-semibold">Alt text<Input value={alt} onChange={(event) => setAlt(event.target.value)} className="mt-1 text-sm" /></label><label className="mt-2 block text-xs font-semibold">Caption<Input value={caption} onChange={(event) => setCaption(event.target.value)} className="mt-1 text-sm" /></label><div className="mt-3 flex flex-wrap gap-2"><Button type="button" size="sm" onClick={() => void onSave(asset, alt, caption)}>Save</Button><Button type="button" size="sm" variant="secondary" onClick={() => void navigator.clipboard.writeText(asset.url)}>Copy URL</Button><ConfirmDialog title="Delete media asset?" description={asset.usageCount > 0 ? "This asset is referenced. The delete check will show exactly where it is used." : "The Cloudinary asset and its metadata will be deleted."} confirmLabel="Delete" onConfirm={() => onRemove(asset)}><Button type="button" size="sm" variant="ghost" className="text-danger">Delete</Button></ConfirmDialog></div>{asset.usageCount > 0 ? <ul className="mt-3 text-xs text-ink-muted">{asset.usages.slice(0, 3).map((usage) => <li key={`${usage.type}-${usage.label}`}>{usage.type}: {usage.label}</li>)}</ul> : null}</div></article>;
}

function MediaPickerSummary({ assets, onSelected }: { assets: MediaAssetView[]; onSelected: (id: string) => void }) { return <details className="rounded-card border bg-surface p-4"><summary className="cursor-pointer font-semibold">MediaPicker preview ({assets.length} assets)</summary><p className="mt-2 text-sm text-ink-muted">The reusable picker is exported from the admin component library for CMS forms.</p><div className="mt-3 flex flex-wrap gap-2">{assets.slice(0, 8).map((asset) => <Button key={asset.id} type="button" size="sm" variant="secondary" onClick={() => onSelected(asset.id)}>{asset.publicId.split("/").pop()}</Button>)}</div></details>; }

function MediaLibraryUploader({ onSaved }: { onSaved: (asset: MediaAssetView) => void }) { return <MediaUploader onSaved={onSaved} />; }
