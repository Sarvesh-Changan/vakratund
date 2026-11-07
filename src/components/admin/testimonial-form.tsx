"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { GripVertical, Trash2, Video, Image as ImageIcon, Plus } from "lucide-react";

import { createTestimonial, updateTestimonial } from "@/app/(admin)/admin/(protected)/testimonials/actions";
import { FormSection } from "@/components/admin/form-section";
import { SectionUploader } from "@/components/admin/section-uploader";
import { Button, FormField, Input, Select, Textarea } from "@/components/ui";
import type { CreateTestimonialInput } from "@/lib/validation/testimonials";
import type { TestimonialView } from "@/server/services/testimonials";
import type { MediaAssetView } from "@/server/services/media";

type TestimonialFormState = CreateTestimonialInput;
type ProjectOption = { id: string; title: string };

/** Tracks an uploaded media item with its optional thumbnail */
type MediaEntry = {
  mediaId: string;
  kind: "IMAGE" | "VIDEO" | string;
  url: string;
  alt: string;
  thumbnailId: string | null;
  thumbnailUrl: string | null;
};

const blank: TestimonialFormState = {
  name: "",
  roleOrOrg: "",
  quote: "",
  rating: null,
  projectId: null,
  photoId: null,
  status: "DRAFT",
  sortOrder: 0,
  mediaIds: [],
  thumbnailIds: {},
};

function initialState(initial: TestimonialView | null): TestimonialFormState {
  if (!initial) return blank;
  const mediaIds = initial.media.map((m) => m.mediaId);
  const thumbnailIds: Record<string, string> = {};
  for (const m of initial.media) {
    if (m.thumbnailId) thumbnailIds[m.mediaId] = m.thumbnailId;
  }
  return {
    name: initial.name,
    roleOrOrg: initial.roleOrOrg ?? "",
    quote: initial.quote,
    rating: initial.rating,
    projectId: initial.projectId,
    photoId: initial.photoId,
    status: initial.status,
    sortOrder: initial.sortOrder,
    mediaIds,
    thumbnailIds,
  };
}

function initialMediaEntries(initial: TestimonialView | null): MediaEntry[] {
  if (!initial) return [];
  return initial.media.map((m) => ({
    mediaId: m.mediaId,
    kind: m.media.kind,
    url: m.media.url,
    alt: m.media.alt,
    thumbnailId: m.thumbnailId,
    thumbnailUrl: m.thumbnail?.url ?? null,
  }));
}

function errorFor(errors: Record<string, string[]>, field: string): string | undefined {
  return errors[field]?.[0];
}

export function TestimonialForm({ initial, projects }: { initial: TestimonialView | null; projects: readonly ProjectOption[] }) {
  const router = useRouter();
  const [form, setForm] = useState(() => initialState(initial));
  const [mediaEntries, setMediaEntries] = useState<MediaEntry[]>(() => initialMediaEntries(initial));
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Which mediaId is currently awaiting a thumbnail upload
  const [awaitingThumbnail, setAwaitingThumbnail] = useState<string | null>(null);
  const isEdit = Boolean(initial);

  function setField<K extends keyof TestimonialFormState>(field: K, value: TestimonialFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: [] }));
  }

  /** Called when a media file (image or video) is uploaded via SectionUploader */
  function handleMediaUploaded(asset: MediaAssetView) {
    const kind = asset.kind;
    const entry: MediaEntry = {
      mediaId: asset.id,
      kind,
      url: asset.url,
      alt: asset.alt,
      thumbnailId: null,
      thumbnailUrl: null,
    };
    setMediaEntries((prev) => {
      // Avoid duplicates
      if (prev.some((e) => e.mediaId === asset.id)) return prev;
      return [...prev, entry];
    });
    setForm((prev) => ({
      ...prev,
      mediaIds: prev.mediaIds.includes(asset.id) ? prev.mediaIds : [...prev.mediaIds, asset.id],
    }));
  }

  /** Called when a thumbnail image is uploaded for a specific video mediaId */
  function handleThumbnailUploaded(videoMediaId: string, asset: MediaAssetView) {
    setMediaEntries((prev) =>
      prev.map((e) => e.mediaId === videoMediaId ? { ...e, thumbnailId: asset.id, thumbnailUrl: asset.url } : e),
    );
    setForm((prev) => ({
      ...prev,
      thumbnailIds: { ...prev.thumbnailIds, [videoMediaId]: asset.id },
    }));
    setAwaitingThumbnail(null);
  }

  /** Remove a media item from the list */
  function removeMedia(mediaId: string) {
    setMediaEntries((prev) => prev.filter((e) => e.mediaId !== mediaId));
    setForm((prev) => {
      const nextThumbnails = { ...prev.thumbnailIds };
      delete nextThumbnails[mediaId];
      return { ...prev, mediaIds: prev.mediaIds.filter((id) => id !== mediaId), thumbnailIds: nextThumbnails };
    });
    if (awaitingThumbnail === mediaId) setAwaitingThumbnail(null);
  }

  /** Move a media item up or down */
  function moveMedia(mediaId: string, direction: "up" | "down") {
    setMediaEntries((prev) => {
      const index = prev.findIndex((e) => e.mediaId === mediaId);
      if (index < 0) return prev;
      const next = [...prev];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= next.length) return prev;
      [next[index], next[swapIndex]] = [next[swapIndex]!, next[index]!];
      return next;
    });
    setForm((prev) => {
      const index = prev.mediaIds.indexOf(mediaId);
      if (index < 0) return prev;
      const next = [...prev.mediaIds];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= next.length) return prev;
      [next[index], next[swapIndex]] = [next[swapIndex]!, next[index]!];
      return { ...prev, mediaIds: next };
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setErrors({});
    const result =
      isEdit && initial
        ? await updateTestimonial({ ...form, id: initial.id })
        : await createTestimonial(form);
    setSaving(false);
    if (!result.ok) {
      setErrors(result.error.fieldErrors ?? {});
      setMessage(result.error.message);
      return;
    }
    router.push("/admin/testimonials");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {message ? <p role="alert" className="rounded-control border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{message}</p> : null}

      {/* ── Testimonial text ──────────────────────────────────────────── */}
      <FormSection title="Testimonial" description="Keep the quote faithful to the approved customer wording. HTML is not accepted.">
        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Name" htmlFor="name" required error={errorFor(errors, "name")}>
            <Input id="name" value={form.name} onChange={(e) => setField("name", e.target.value)} />
          </FormField>
          <FormField label="Role or organisation" htmlFor="roleOrOrg" hint="Optional, for example Secretary, XYZ CHSL." error={errorFor(errors, "roleOrOrg")}>
            <Input id="roleOrOrg" value={form.roleOrOrg} onChange={(e) => setField("roleOrOrg", e.target.value)} />
          </FormField>
        </div>
        <FormField label="Quote" htmlFor="quote" required error={errorFor(errors, "quote")}>
          <Textarea id="quote" rows={6} value={form.quote} onChange={(e) => setField("quote", e.target.value)} />
        </FormField>
      </FormSection>

      {/* ── Media (images + videos) ───────────────────────────────────── */}
      <FormSection title="Media" description="Upload one or more images or videos. For video items you may optionally upload a custom thumbnail image. Drag the ⠿ handle to reorder.">

        {/* Existing / added media list */}
        {mediaEntries.length > 0 && (
          <ul className="mb-4 space-y-3" aria-label="Uploaded media items">
            {mediaEntries.map((entry, index) => (
              <li key={entry.mediaId} className="rounded-control border bg-surface p-3">
                <div className="flex items-start gap-3">
                  {/* Drag handle (visual only — reorder via buttons) */}
                  <span className="mt-1 shrink-0 cursor-grab text-ink-muted" aria-hidden="true">
                    <GripVertical size={18} />
                  </span>

                  {/* Preview */}
                  <div className="relative shrink-0">
                    {entry.kind === "VIDEO" ? (
                      <div className="flex size-20 items-center justify-center rounded-control bg-surface-alt">
                        {entry.thumbnailUrl ? (
                          <Image src={entry.thumbnailUrl} alt="Thumbnail" width={80} height={80} className="size-20 rounded-control object-cover" />
                        ) : (
                          <Video size={28} className="text-ink-muted" aria-hidden="true" />
                        )}
                      </div>
                    ) : (
                      <Image src={entry.url} alt={entry.alt} width={80} height={80} className="size-20 rounded-control object-cover" unoptimized />
                    )}
                    <span className="absolute -right-1 -top-1 rounded-full bg-surface-alt px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ink-muted ring-1 ring-line">
                      {entry.kind === "VIDEO" ? "VID" : "IMG"}
                    </span>
                  </div>

                  {/* Info + actions */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{entry.alt || entry.url.split("/").pop()}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">Item {index + 1} of {mediaEntries.length}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => moveMedia(entry.mediaId, "up")} disabled={index === 0} aria-label="Move up">↑</Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => moveMedia(entry.mediaId, "down")} disabled={index === mediaEntries.length - 1} aria-label="Move down">↓</Button>
                      {entry.kind === "VIDEO" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => setAwaitingThumbnail(awaitingThumbnail === entry.mediaId ? null : entry.mediaId)}
                        >
                          <ImageIcon size={14} className="mr-1" aria-hidden="true" />
                          {entry.thumbnailId ? "Replace thumbnail" : "Add thumbnail"}
                        </Button>
                      )}
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeMedia(entry.mediaId)}>
                        <Trash2 size={14} className="mr-1 text-danger" aria-hidden="true" />
                        Remove
                      </Button>
                    </div>

                    {/* Inline thumbnail uploader for this video */}
                    {entry.kind === "VIDEO" && awaitingThumbnail === entry.mediaId && (
                      <div className="mt-3 rounded-control border border-dashed p-3">
                        <p className="mb-2 text-xs font-semibold text-ink-muted">Upload thumbnail image for this video</p>
                        <SectionUploader
                          section="testimonials"
                          accept=".jpg,.jpeg,.png,.webp,.avif"
                          defaultAlt={entry.alt ? `Thumbnail for ${entry.alt}` : "Video thumbnail"}
                          onUploaded={(asset) => handleThumbnailUploaded(entry.mediaId, asset)}
                          title="Thumbnail image"
                          previewAspect="4/3"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Add more media */}
        <div className="rounded-control border border-dashed p-1">
          <SectionUploader
            section="testimonials"
            multiple
            defaultAlt={form.name}
            onUploaded={handleMediaUploaded}
            title={mediaEntries.length === 0 ? "Upload images or videos" : "Add more media"}
          />
        </div>
        {errorFor(errors, "mediaIds") && <p role="alert" className="mt-1 text-sm text-danger">{errorFor(errors, "mediaIds")}</p>}
        {errorFor(errors, "thumbnailIds") && <p role="alert" className="mt-1 text-sm text-danger">{errorFor(errors, "thumbnailIds")}</p>}

        <p className="mt-2 text-xs text-ink-muted">
          <Plus size={12} className="mr-1 inline" aria-hidden="true" />
          Images and videos are stored in the <strong>testimonials</strong> Cloudinary folder. Videos without a thumbnail will show a play icon placeholder.
        </p>
      </FormSection>

      {/* ── Legacy single photo (kept for backwards compat) ───────────── */}
      <FormSection title="Legacy single photo" description="Existing single-photo field. Prefer the Media section above for new uploads.">
        <SectionUploader section="testimonials" defaultAlt={form.name} onUploaded={(asset) => setField("photoId", asset.id)} title="Testimonial photo (legacy)" />
        {initial?.photo ? (
          <div className="flex items-center gap-3 rounded-control border p-3">
            <Image src={initial.photo.url} alt={initial.photo.alt} width={96} height={96} unoptimized className="size-20 rounded-control object-cover" />
            <Button type="button" size="sm" variant="ghost" onClick={() => setField("photoId", null)}>Remove current photo</Button>
          </div>
        ) : null}
        <p className="text-sm text-danger">{errorFor(errors, "photoId")}</p>
      </FormSection>

      {/* ── Context ───────────────────────────────────────────────────── */}
      <FormSection title="Context" description="A testimonial may optionally be linked to a project and rated from one to five.">
        <div className="grid gap-5 md:grid-cols-3">
          <FormField label="Rating" htmlFor="rating" hint="Optional, from 1 to 5." error={errorFor(errors, "rating")}>
            <Select id="rating" value={form.rating?.toString() ?? ""} onChange={(e) => setField("rating", e.target.value ? Number(e.target.value) : null)}>
              <option value="">No rating</option>
              {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{r} / 5</option>)}
            </Select>
          </FormField>
          <FormField label="Project link" htmlFor="projectId" hint="Optional public project reference." error={errorFor(errors, "projectId")}>
            <Select id="projectId" value={form.projectId ?? ""} onChange={(e) => setField("projectId", e.target.value || null)}>
              <option value="">No project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </Select>
          </FormField>
          <FormField label="Order" htmlFor="sortOrder" hint="Lower numbers appear first." error={errorFor(errors, "sortOrder")}>
            <Input id="sortOrder" type="number" min={0} value={form.sortOrder} onChange={(e) => setField("sortOrder", Number(e.target.value))} />
          </FormField>
        </div>
      </FormSection>

      {/* ── Publication ───────────────────────────────────────────────── */}
      <FormSection title="Publication">
        <FormField label="Status" htmlFor="status" required error={errorFor(errors, "status")}>
          <Select id="status" value={form.status} onChange={(e) => setField("status", e.target.value as TestimonialFormState["status"])}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </FormField>
      </FormSection>

      {/* ── Actions ───────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" loading={saving}>{isEdit ? "Save testimonial" : "Create testimonial"}</Button>
      </div>
    </form>
  );
}
