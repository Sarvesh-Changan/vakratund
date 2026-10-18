"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";

import { saveMediaAsset } from "@/app/(admin)/admin/(protected)/media/actions";
import { Button, Input } from "@/components/ui";
import { cloudinaryFolder, cloudinaryResourceType, SECTION_POLICIES, UPLOAD_POLICIES, type UploadKind, type UploadSection, uploadPolicy } from "@/lib/cloudinary/policy";
import type { MediaAssetView } from "@/server/services/media";

type UploadJob = {
  id: string;
  file: File;
  kind: UploadKind;
  previewUrl: string | null;
  alt: string;
  title: string;
  caption: string;
  progress: number;
  status: "queued" | "uploading" | "saving" | "done" | "error";
  error?: string;
  asset?: MediaAssetView;
};

type SignedResponse = {
  api_key: string;
  cloud_name: string;
  resource_type: "image" | "video" | "raw";
  section: UploadSection;
  folder: string;
  timestamp: number;
  signature: string;
  allowed_formats: string;
  signed_parameter_names: string[];
  transformation?: string;
};

type CloudinaryResponse = {
  public_id: string;
  secure_url: string;
  format: string;
  bytes: number;
  etag: string;
  duration?: number;
  width?: number;
  height?: number;
};

class CloudinaryUploadError extends Error {
  readonly providerMessage: string;

  constructor(providerMessage: string, message: string) {
    super(message);
    this.name = "CloudinaryUploadError";
    this.providerMessage = providerMessage;
  }
}

function isSignedResponse(value: unknown): value is SignedResponse {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.api_key === "string" && typeof item.cloud_name === "string" && typeof item.resource_type === "string" && typeof item.section === "string" && typeof item.folder === "string" && typeof item.timestamp === "number" && typeof item.signature === "string" && typeof item.allowed_formats === "string" && Array.isArray(item.signed_parameter_names) && item.signed_parameter_names.every((name) => typeof name === "string");
}

function isCloudinaryResponse(value: unknown): value is CloudinaryResponse {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.public_id === "string" && typeof item.secure_url === "string" && typeof item.format === "string" && typeof item.bytes === "number" && typeof item.etag === "string";
}

function mapCloudinaryError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("file size") || normalized.includes("too large") || normalized.includes("maximum file")) return "File too large.";
  if (normalized.includes("format") || normalized.includes("extension") || normalized.includes("unsupported")) return "Format not allowed for this section.";
  if (normalized.includes("signature") || normalized.includes("timestamp") || normalized.includes("authentication")) return "Invalid signature. Refresh the page and try again.";
  if (normalized.includes("folder") || normalized.includes("public_id")) return "Upload destination was rejected.";
  return "Cloudinary rejected this file.";
}

function kindForFile(file: File): UploadKind | null {
  if (file.type.startsWith("image/")) return "IMAGE";
  if (file.type.startsWith("video/")) return "VIDEO";
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return "DOCUMENT";
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension && (UPLOAD_POLICIES.IMAGE.formats as readonly string[]).includes(extension)) return "IMAGE";
  if (extension && (UPLOAD_POLICIES.VIDEO.formats as readonly string[]).includes(extension)) return "VIDEO";
  return null;
}

function formatLimit(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

function uploadToCloudinary(file: File, signed: SignedResponse, onProgress: (value: number) => void): Promise<CloudinaryResponse> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `https://api.cloudinary.com/v1_1/${signed.cloud_name}/${signed.resource_type}/upload`);
    request.upload.onprogress = (event) => { if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100)); };
    request.onerror = () => reject(new CloudinaryUploadError("network error", "Cloudinary upload failed. Check your connection and try again."));
    request.onload = () => {
      let body: unknown;
      try { body = JSON.parse(request.responseText) as unknown; } catch { reject(new CloudinaryUploadError("invalid response", "Cloudinary returned an invalid response.")); return; }
      if (request.status < 200 || request.status >= 300 || !isCloudinaryResponse(body)) {
        const providerMessage = typeof body === "object" && body !== null && "error" in body && typeof body.error === "object" && body.error !== null && "message" in body.error && typeof body.error.message === "string" ? body.error.message : "Cloudinary rejected this file.";
        reject(new CloudinaryUploadError(providerMessage, mapCloudinaryError(providerMessage)));
        return;
      }
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

function reportCloudinaryError(message: string, signedParameterNames: readonly string[]): void {
  void fetch("/api/upload/error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ message, signedParameterNames }),
  }).catch(() => undefined);
}

export function SectionUploader({ section, multiple = false, accept, defaultAlt = "", defaultTitle = "", onUploaded, onRemoved, title = "Upload media" }: { section: UploadSection; multiple?: boolean; accept?: string; defaultAlt?: string | ((file: File) => string); defaultTitle?: string; onUploaded: (asset: MediaAssetView, details?: { fileName: string; title: string; duration?: number }) => void | Promise<void>; onRemoved?: (asset: MediaAssetView) => void; title?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [dragging, setDragging] = useState(false);
  const [queueMessage, setQueueMessage] = useState<string | null>(null);
  const policy = SECTION_POLICIES[section];
  const acceptValue = accept ?? policy.kinds.flatMap((kind) => uploadPolicy(section, kind)?.formats.map((format) => `.${format}`) ?? []).join(",");
  const limitSummary = useMemo(() => policy.kinds.map((kind) => `${kind.toLowerCase()}: ${uploadPolicy(section, kind) ? formatLimit(uploadPolicy(section, kind)?.maxBytes ?? 0) : "not allowed"}`).join(" · "), [policy.kinds, section]);

  function addFiles(files: FileList | File[]): void {
    const next: UploadJob[] = [];
    for (const file of Array.from(files)) {
      const kind = kindForFile(file);
      const upload = kind ? uploadPolicy(section, kind) : null;
      if (!kind || !upload) { setQueueMessage(`${file.name}: this file type is not allowed in the ${section} section.`); continue; }
      if (file.size > upload.maxBytes) { setQueueMessage(`${file.name}: file is too large. Maximum ${formatLimit(upload.maxBytes)}.`); continue; }
      next.push({ id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`, file, kind, previewUrl: kind === "IMAGE" ? URL.createObjectURL(file) : null, alt: typeof defaultAlt === "function" ? defaultAlt(file) : defaultAlt, title: defaultTitle || (typeof defaultAlt === "string" ? defaultAlt : "") || file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim(), caption: "", progress: 0, status: "queued" });
    }
    if (!multiple) setJobs((current) => { current.forEach((job) => { if (job.previewUrl) URL.revokeObjectURL(job.previewUrl); }); return next.slice(0, 1); });
    else setJobs((current) => [...current, ...next]);
  }

  function updateJob(id: string, patch: Partial<UploadJob>): void { setJobs((current) => current.map((job) => job.id === id ? { ...job, ...patch } : job)); }

  function removeJob(job: UploadJob): void {
    if (job.previewUrl) URL.revokeObjectURL(job.previewUrl);
    if (job.asset) onRemoved?.(job.asset);
    setJobs((current) => current.filter((item) => item.id !== job.id));
  }

  async function uploadJob(job: UploadJob): Promise<void> {
    const fallbackAlt = typeof defaultAlt === "function" ? defaultAlt(job.file) : defaultAlt;
    const alt = job.alt.trim() || fallbackAlt.trim();
    if (job.kind === "IMAGE" && !alt) { updateJob(job.id, { status: "error", error: "Alt text is required for images." }); return; }
    updateJob(job.id, { status: "uploading", error: undefined, alt });
    let signed: SignedResponse | null = null;
    try {
      const signResponse = await fetch("/api/upload/sign", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ section, kind: job.kind }) });
      const signedBody: unknown = await signResponse.json();
      if (!signResponse.ok || !isSignedResponse(signedBody) || signedBody.section !== section || signedBody.folder !== cloudinaryFolder(section) || signedBody.resource_type !== cloudinaryResourceType(job.kind)) throw new Error("Could not authorize this section upload.");
      signed = signedBody;
      const uploaded = await uploadToCloudinary(job.file, signed, (progress) => updateJob(job.id, { progress }));
      updateJob(job.id, { status: "saving", progress: 100 });
      const saved = await saveMediaAsset({ section, publicId: uploaded.public_id, url: uploaded.secure_url, kind: job.kind, format: uploaded.format, bytes: uploaded.bytes, etag: uploaded.etag, width: uploaded.width, height: uploaded.height, alt, caption: job.caption || undefined });
      if (!saved.ok) throw new Error(saved.error.message);
      updateJob(job.id, { status: "done", error: undefined, asset: saved.data });
      await onUploaded(saved.data, { fileName: job.file.name, title: job.title, ...(uploaded.duration !== undefined ? { duration: uploaded.duration } : {}) });
    } catch (error) {
      if (error instanceof CloudinaryUploadError && signed) reportCloudinaryError(error.providerMessage, signed.signed_parameter_names);
      updateJob(job.id, { status: "error", error: error instanceof Error ? error.message : "Upload failed." });
    }
  }

  async function uploadAll(): Promise<void> { for (const job of jobs.filter((item) => item.status === "queued" || item.status === "error")) await uploadJob(job); }

  return <section className="rounded-control border bg-surface-alt p-4" aria-labelledby={`${section}-uploader-heading`}><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 id={`${section}-uploader-heading`} className="font-semibold">{title}</h3><p className="mt-1 text-xs text-ink-muted">Fixed folder: {policy.folder} · Limits: {limitSummary}</p></div><Button type="button" size="sm" onClick={() => void uploadAll()} disabled={!jobs.some((job) => job.status === "queued" || job.status === "error")}>Upload selected</Button></div><button type="button" className={`mt-4 flex min-h-28 w-full flex-col items-center justify-center rounded-control border-2 border-dashed p-4 text-sm ${dragging ? "border-brand-deep bg-brand/10" : "hover:bg-surface"}`} onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}><span className="font-semibold">Drop files here or browse</span><span className="mt-1 text-ink-muted">Allowed: {acceptValue.replaceAll(".", "").replaceAll(",", ", ")}</span><input ref={inputRef} type="file" multiple={multiple} className="sr-only" accept={acceptValue} onChange={(event) => { if (event.target.files) addFiles(event.target.files); event.target.value = ""; }} /></button>{queueMessage ? <p role="alert" className="mt-2 text-sm text-danger">{queueMessage}</p> : null}<div className="mt-4 space-y-3">{jobs.map((job) => <article key={job.id} className="rounded-control border bg-surface p-3"><div className="flex items-start gap-3">{job.previewUrl ? <Image src={job.previewUrl} alt="" width={64} height={64} unoptimized className="size-16 rounded-control object-cover" /> : <div className="flex size-16 items-center justify-center rounded-control bg-surface-alt text-xs font-semibold">{job.kind}</div>}<div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="truncate text-sm font-semibold">{job.file.name}</p><span className="shrink-0 text-xs text-ink-muted">{job.status === "done" ? "Saved" : job.status === "uploading" ? `${job.progress}%` : job.status}</span></div>{job.kind === "IMAGE" ? <label className="mt-2 block text-xs font-semibold">Alt text{defaultAlt ? <span className="font-normal text-ink-muted"> (defaults to entity title)</span> : null}<Input value={job.alt} onChange={(event) => updateJob(job.id, { alt: event.target.value })} className="mt-1 text-sm" placeholder="Describe the image and its context" /></label> : null}<label className="mt-2 block text-xs font-semibold">Caption (optional)<Input value={job.caption} onChange={(event) => updateJob(job.id, { caption: event.target.value })} className="mt-1 text-sm" /></label>{job.status === "uploading" ? <progress className="mt-3 h-2 w-full" value={job.progress} max="100" aria-label={`Uploading ${job.file.name}`} /> : null}{job.error ? <p role="alert" className="mt-2 text-sm text-danger">{job.error}</p> : null}<div className="mt-2 flex flex-wrap gap-2"><Button type="button" size="sm" variant="secondary" onClick={() => void uploadJob(job)} disabled={job.status === "uploading" || job.status === "saving"}>{job.status === "error" ? "Retry" : "Upload"}</Button><Button type="button" size="sm" variant="ghost" onClick={() => removeJob(job)}>Remove</Button></div></div></div></article>)}</div>{jobs.length > 0 ? <p className="mt-3 text-xs text-ink-muted">Removing a saved item only removes it from this queue; the library will offer deletion when it is no longer referenced.</p> : null}</section>;
}
