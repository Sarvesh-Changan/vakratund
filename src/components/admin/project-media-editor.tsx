"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Play } from "lucide-react";

import { CloudImage } from "@/components/cloud-image";
import { CloudVideoPoster } from "@/components/cloud-video-poster";
import { SectionUploader } from "@/components/admin/section-uploader";
import type { MediaPickerAsset } from "@/components/admin/media-picker";
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
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  const assetById = new Map(availableAssets.map((asset) => [asset.id, asset]));

  function updateFlag(index: number, flag: "isCover" | "isBefore" | "isAfter", checked: boolean): void {
    onChange(value.map((item, itemIndex) => {
      if (flag === "isCover" && checked) return { ...item, isCover: itemIndex === index };
      return itemIndex === index ? { ...item, [flag]: checked } : item;
    }));
  }

  function move(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    onChange(reorder(value, index, target));
  }

  function removeFromProject(index: number): void {
    onChange(value.filter((_, itemIndex) => itemIndex !== index).map((item, sortOrder) => ({ ...item, sortOrder })));
  }

  function addUploadedAsset(asset: MediaPickerAsset): void {
    setAvailableAssets((current) => [...current, asset]);
    const current = valueRef.current;
    const next = [...current, { mediaId: asset.id, isCover: asset.kind === "IMAGE" && !current.some((item) => item.isCover), isBefore: false, isAfter: false, sortOrder: current.length }];
    valueRef.current = next;
    onChange(next);
  }

  const selectedCoverIndex = value.findIndex((item) => item.isCover);
  return (
    <div className="space-y-4">
      <SectionUploader
        section="projects"
        multiple
        defaultAlt={entityTitle}
        onUploaded={addUploadedAsset}
        title="Upload project images or videos"
      />
      {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
      {value.length === 0 ? (
        <p className="rounded-control border border-dashed p-4 text-sm text-ink-muted">No images or videos have been added to this project yet.</p>
      ) : (
        <div className="space-y-3" aria-label="Images and videos attached to this project">
          {value.map((item, index) => {
            const asset = assetById.get(item.mediaId);
            if (!asset) return null;
            return (
              <article
                key={item.mediaId}
                draggable
                onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  const from = Number(event.dataTransfer.getData("text/plain"));
                  if (Number.isInteger(from)) onChange(reorder(value, from, index));
                }}
                className="grid grid-cols-[5.5rem_minmax(0,1fr)] overflow-hidden rounded-control border bg-surface"
              >
                <div className="relative aspect-square overflow-hidden bg-surface-alt">
                    {asset.kind === "IMAGE" ? (
                      <CloudImage src={asset.url} alt={asset.alt} fill sizes="6rem" className="object-cover" />
                    ) : (
                      <>
                        <CloudVideoPoster src={asset.url} alt={asset.alt || "Project video"} fill sizes="6rem" className="object-cover" />
                        <span className="absolute inset-0 flex items-center justify-center bg-dark/20"><span className="flex size-11 items-center justify-center rounded-full bg-dark/80 text-white"><Play size={19} fill="currentColor" aria-hidden="true" /></span></span>
                      </>
                    )}
                    {item.isCover ? <span className="absolute left-2 top-2 rounded-pill bg-brand px-2 py-1 text-xs font-bold leading-4 text-ink">Cover image</span> : asset.kind === "VIDEO" ? <span className="absolute left-2 top-2 rounded-pill bg-dark/85 px-2 py-1 text-xs font-bold leading-4 text-white">Video</span> : null}
                </div>
                <div className="flex min-w-0 flex-col justify-center gap-2 p-2 sm:p-3">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-base font-semibold leading-5">{asset.alt || `${asset.kind === "VIDEO" ? "Video" : "Image"} ${index + 1}`}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <label className="flex items-center gap-1"><Checkbox checked={item.isCover} disabled={!item.isCover && (asset.kind !== "IMAGE" || (selectedCoverIndex !== -1 && selectedCoverIndex !== index))} onChange={(event) => updateFlag(index, "isCover", event.target.checked)} /> Cover</label>
                    <label className="flex items-center gap-1"><Checkbox checked={item.isBefore} onChange={(event) => updateFlag(index, "isBefore", event.target.checked)} /> Before</label>
                    <label className="flex items-center gap-1"><Checkbox checked={item.isAfter} onChange={(event) => updateFlag(index, "isAfter", event.target.checked)} /> After</label>
                    <div className="ml-auto flex items-center gap-1">
                      <Button type="button" size="sm" variant="secondary" className="size-9 min-h-9 px-0" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move image ${index + 1} up`}><ArrowUp size={14} aria-hidden="true" /></Button>
                      <Button type="button" size="sm" variant="secondary" className="size-9 min-h-9 px-0" onClick={() => move(index, 1)} disabled={index === value.length - 1} aria-label={`Move image ${index + 1} down`}><ArrowDown size={14} aria-hidden="true" /></Button>
                      <Button type="button" size="sm" variant="ghost" className="min-h-9 px-2" onClick={() => removeFromProject(index)} aria-label={`Remove image ${index + 1} from this project`}>Remove</Button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
