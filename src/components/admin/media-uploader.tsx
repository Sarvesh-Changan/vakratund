"use client";

import { useRef, useState } from "react";

import { Button, Input, Select } from "@/components/ui";
import { saveMediaAsset } from "@/app/(admin)/admin/(protected)/media/actions";
import type { MediaAssetView } from "@/server/services/media";
import { UPLOAD_FOLDERS, UPLOAD_POLICIES, type UploadFolder, type UploadKind } from "@/lib/cloudinary/policy";

type UploadJob = {
  id: string;
  file: File;
  alt: string;
  caption: string;
  progress: number;
  status: "queued" | "uploading" | "saving" | "done" | "error";
  error?: string;
};

type SignedResponse = { api_key: string; cloud_name: string; folder: string; timestamp: number; signature: string; allowed_formats: string; transformation?: string };
type CloudinaryResponse = { public_id: string; secure_url: string; format: string; bytes: number; width?: number; height?: number };

function isSignedResponse(value: unknown): value is SignedResponse {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.api_key === "string" && typeof item.cloud_name === "string" && typeof item.folder === "string" && typeof item.timestamp === "number" && typeof item.signature === "string" && typeof item.allowed_formats === "string";
}

function isCloudinaryResponse(value: unknown): value is CloudinaryResponse {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.public_id === "string" && typeof item.secure_url === "string" && typeof item.format === "string" && typeof item.bytes === "number";
}

function uploadToCloudinary(file: File, signed: SignedResponse, onProgress: (value: number) => void): Promise<CloudinaryResponse> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `https://api.cloudinary.com/v1_1/${signed.cloud_name}/auto/upload`);
    request.upload.onprogress = (event) => { if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100)); };
    request.onerror = () => reject(new Error("Cloudinary upload failed."));
    request.onload = () => {
      let body: unknown;
      try { body = JSON.parse(request.responseText) as unknown; } catch { reject(new Error("Cloudinary returned an invalid response.")); return; }
      if (request.status < 200 || request.status >= 300 || !isCloudinaryResponse(body)) { reject(new Error("Cloudinary rejected this file.")); return; }
      resolve(body);
    };
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", signed.api_key);
    form.append("folder", signed.folder);
    form.append("timestamp", String(signed.timestamp));
    form.append("allowed_formats", signed.allowed_formats);
    if (signed.transformation) form.append("transformation", signed.transformation);
    form.append("signature", signed.signature);
    request.send(form);
  });
}

export function MediaUploader({ onSaved }: { onSaved: (asset: MediaAssetView) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [folder, setFolder] = useState<UploadFolder>("projects");
  const [kind, setKind] = useState<UploadKind>("IMAGE");
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [dragging, setDragging] = useState(false);

  function addFiles(files: FileList | File[]) {
    const maxBytes = UPLOAD_POLICIES[kind].maxBytes;
    const next = Array.from(files).filter((file) => file.size <= maxBytes).map((file, index) => ({ id: `${file.name}-${file.lastModified}-${index}`, file, alt: "", caption: "", progress: 0, status: "queued" as const }));
    setJobs((current) => [...current, ...next]);
  }

  function updateJob(id: string, patch: Partial<UploadJob>) {
    setJobs((current) => current.map((job) => job.id === id ? { ...job, ...patch } : job));
  }

  async function uploadJob(job: UploadJob): Promise<void> {
    if (kind === "IMAGE" && !job.alt.trim()) { updateJob(job.id, { status: "error", error: "Alt text is required for images." }); return; }
    updateJob(job.id, { status: "uploading", error: undefined });
    try {
      const signResponse = await fetch("/api/upload/sign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folder, kind }) });
      const signedBody: unknown = await signResponse.json();
      if (!signResponse.ok || !isSignedResponse(signedBody)) throw new Error("Could not authorize the upload.");
      const uploaded = await uploadToCloudinary(job.file, signedBody, (progress) => updateJob(job.id, { progress }));
      updateJob(job.id, { status: "saving", progress: 100 });
      const saved = await saveMediaAsset({ publicId: uploaded.public_id, url: uploaded.secure_url, kind, format: uploaded.format, bytes: uploaded.bytes, width: uploaded.width, height: uploaded.height, alt: job.alt, caption: job.caption || undefined, folder: signedBody.folder });
      if (!saved.ok) throw new Error(saved.error.message);
      updateJob(job.id, { status: "done" });
      onSaved(saved.data);
    } catch (error) {
      updateJob(job.id, { status: "error", error: error instanceof Error ? error.message : "Upload failed." });
    }
  }

  async function uploadAll() {
    for (const job of jobs.filter((item) => item.status === "queued" || item.status === "error")) await uploadJob(job);
  }

  return <section className="rounded-card border bg-surface p-5 shadow-soft" aria-labelledby="media-upload-heading"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 id="media-upload-heading" className="text-lg font-semibold">Upload media</h2><p className="mt-1 text-sm text-ink-muted">Files go directly to Cloudinary. The server stores metadata only.</p></div><Button type="button" onClick={uploadAll} disabled={jobs.every((job) => job.status === "done") || jobs.length === 0}>Upload queued files</Button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Folder<Select value={folder} onChange={(event) => setFolder(event.target.value as UploadFolder)} className="mt-2">{UPLOAD_FOLDERS.map((item) => <option key={item} value={item}>{item}</option>)}</Select></label><label className="text-sm font-semibold">Kind<Select value={kind} onChange={(event) => setKind(event.target.value as UploadKind)} className="mt-2"><option value="IMAGE">Images</option><option value="VIDEO">Video</option><option value="DOCUMENT">PDF documents</option></Select></label></div><button type="button" className={`mt-4 flex min-h-28 w-full flex-col items-center justify-center rounded-control border-2 border-dashed p-4 text-sm ${dragging ? "border-brand-deep bg-brand/10" : "hover:bg-surface-alt"}`} onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}><span className="font-semibold">Drop files here or browse</span><span className="mt-1 text-ink-muted">Maximum {Math.round(UPLOAD_POLICIES[kind].maxBytes / (1024 * 1024))} MB per file</span><input ref={inputRef} type="file" multiple className="sr-only" accept={UPLOAD_POLICIES[kind].formats.map((format) => `.${format}`).join(",")} onChange={(event) => { if (event.target.files) addFiles(event.target.files); event.target.value = ""; }} /></button>{jobs.length > 0 ? <div className="mt-5 space-y-3">{jobs.map((job) => <div key={job.id} className="rounded-control border p-3"><div className="flex items-start justify-between gap-3"><p className="truncate text-sm font-semibold">{job.file.name}</p><span className="shrink-0 text-xs text-ink-muted">{job.status === "done" ? "Saved" : job.status === "saving" ? "Saving" : job.status === "uploading" ? `${job.progress}%` : job.status}</span></div>{kind === "IMAGE" ? <label className="mt-2 block text-xs font-semibold">Alt text<Input value={job.alt} onChange={(event) => updateJob(job.id, { alt: event.target.value })} className="mt-1 text-sm" placeholder="Describe the image and its context" /></label> : null}<label className="mt-2 block text-xs font-semibold">Caption (optional)<Input value={job.caption} onChange={(event) => updateJob(job.id, { caption: event.target.value })} className="mt-1 text-sm" /></label>{job.status === "uploading" ? <progress className="mt-3 h-2 w-full" value={job.progress} max="100" aria-label={`Uploading ${job.file.name}`} /> : null}{job.error ? <p className="mt-2 text-sm text-danger" role="alert">{job.error}</p> : null}</div>)}</div> : null}</section>;
}
