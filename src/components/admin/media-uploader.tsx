"use client";

import { useState } from "react";

import { SectionUploader } from "@/components/admin/section-uploader";
import { Select } from "@/components/ui";
import { UPLOAD_SECTIONS, type UploadSection } from "@/lib/cloudinary/policy";
import type { MediaAssetView } from "@/server/services/media";

export function MediaUploader({ onSaved }: { onSaved: (asset: MediaAssetView) => void }) {
  const [section, setSection] = useState<UploadSection>("projects");
  return <section className="space-y-4" aria-labelledby="media-upload-heading"><div><h2 id="media-upload-heading" className="text-lg font-semibold">Upload media</h2><label className="mt-3 block max-w-xs text-sm font-semibold">Section<Select value={section} onChange={(event) => setSection(event.target.value as UploadSection)} className="mt-2">{UPLOAD_SECTIONS.map((item) => <option key={item} value={item}>{item[0]?.toUpperCase()}{item.slice(1)}</option>)}</Select></label></div><SectionUploader section={section} multiple onUploaded={onSaved} title="Section upload" /></section>;
}
