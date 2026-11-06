"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  GripVertical,
  Info,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import type { AdminHomeSlideView, HomeShowcaseSettings } from "@/server/services/home-slides";
import {
  createHomeSlideAction,
  deleteHomeSlideAction,
  deleteAllHomeSlidesAction,
  reorderHomeSlideAction,
  setHomeSlideOrderAction,
  toggleHomeSlideActiveAction,
  updateHomeShowcaseSettingsAction,
  updateHomeSlideAction,
} from "@/app/(admin)/admin/(protected)/home-slider/actions";
import { SectionUploader } from "@/components/admin/section-uploader";
import { Badge, Button, Card, Dialog, DialogPanel, Switch } from "@/components/ui";
import type { MediaAssetView } from "@/server/services/media";

type UploadedDraft = {
  asset: MediaAssetView;
  alt: string;
  title: string;
  caption: string;
  linkUrl: string;
};

export function HomeSliderManager({
  initialSlides,
  initialSettings,
}: {
  initialSlides: AdminHomeSlideView[];
  initialSettings: HomeShowcaseSettings;
}) {
  const [slides, setSlides] = useState(initialSlides);
  const [settings, setSettings] = useState(initialSettings);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [draftUploads, setDraftUploads] = useState<UploadedDraft[]>([]);

  const [editingSlide, setEditingSlide] = useState<AdminHomeSlideView | null>(null);
  const [editForm, setEditForm] = useState({
    alt: "",
    title: "",
    caption: "",
    linkUrl: "",
    isActive: true,
    mediaId: "",
  });

  const [deleteTarget, setDeleteTarget] = useState<AdminHomeSlideView | null>(null);
  const [deleteCloudinary, setDeleteCloudinary] = useState(false);

  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const [deleteAllCloudinary, setDeleteAllCloudinary] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeCount = slides.filter((s) => s.isActive).length;
  const hasSamplePhotos = slides.some((s) => s.isPlaceholder && s.isActive);

  // Settings Save
  function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsMessage(null);
    startTransition(async () => {
      const res = await updateHomeShowcaseSettingsAction(settings);
      if (res.ok) {
        setSettingsMessage("Slider settings saved.");
      } else {
        setSettingsMessage(res.error.message);
      }
    });
  }

  // Toggle Active
  function handleToggleActive(slide: AdminHomeSlideView) {
    const nextState = !slide.isActive;
    setSlides((prev) => prev.map((s) => (s.id === slide.id ? { ...s, isActive: nextState } : s)));
    startTransition(async () => {
      const res = await toggleHomeSlideActiveAction({ id: slide.id, isActive: nextState });
      if (!res.ok) {
        // revert on failure
        setSlides((prev) => prev.map((s) => (s.id === slide.id ? { ...s, isActive: slide.isActive } : s)));
      }
    });
  }

  // Move Single
  function handleMove(id: string, direction: "up" | "down") {
    const index = slides.findIndex((s) => s.id === id);
    if (index === -1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const newSlides = [...slides];
    const [moved] = newSlides.splice(index, 1);
    if (!moved) return;
    newSlides.splice(targetIndex, 0, moved);
    setSlides(newSlides);

    startTransition(async () => {
      await reorderHomeSlideAction({ id, direction });
    });
  }

  // Drag and drop reorder
  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newSlides = [...slides];
    const [draggedItem] = newSlides.splice(draggedIndex, 1);
    if (!draggedItem) return;
    newSlides.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setSlides(newSlides);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
    startTransition(async () => {
      await setHomeSlideOrderAction({ orderedIds: slides.map((s) => s.id) });
    });
  }

  // Add Uploads Handler
  function handleAssetUploaded(asset: MediaAssetView, details?: { fileName: string }) {
    const nameWithoutExt = details?.fileName ? details.fileName.replace(/\.[^/.]+$/, "").replaceAll(/[-_]/g, " ") : "";
    setDraftUploads((prev) => [
      ...prev,
      {
        asset,
        alt: asset.alt || nameWithoutExt || "Project photo",
        title: nameWithoutExt ? nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1) : "",
        caption: "",
        linkUrl: "",
      },
    ]);
  }

  function handleSaveNewUploads() {
    if (draftUploads.length === 0) return;
    startTransition(async () => {
      for (const draft of draftUploads) {
        const res = await createHomeSlideAction({
          mediaId: draft.asset.id,
          alt: draft.alt,
          title: draft.title || undefined,
          caption: draft.caption || undefined,
          linkUrl: draft.linkUrl || undefined,
          isActive: true,
          isPlaceholder: false,
        });
        if (res.ok) {
          setSlides((prev) => [...prev, res.data]);
        }
      }
      setDraftUploads([]);
      setAddModalOpen(false);
    });
  }

  // Edit handler
  function openEdit(slide: AdminHomeSlideView) {
    setEditingSlide(slide);
    setEditForm({
      alt: slide.alt,
      title: slide.title ?? "",
      caption: slide.caption ?? "",
      linkUrl: slide.linkUrl ?? "",
      isActive: slide.isActive,
      mediaId: slide.mediaId,
    });
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSlide) return;
    startTransition(async () => {
      const res = await updateHomeSlideAction({
        id: editingSlide.id,
        alt: editForm.alt,
        title: editForm.title || undefined,
        caption: editForm.caption || undefined,
        linkUrl: editForm.linkUrl || undefined,
        isActive: editForm.isActive,
        mediaId: editForm.mediaId !== editingSlide.mediaId ? editForm.mediaId : undefined,
      });
      if (res.ok) {
        setSlides((prev) => prev.map((s) => (s.id === editingSlide.id ? res.data : s)));
        setEditingSlide(null);
      }
    });
  }

  // Delete handler
  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    startTransition(async () => {
      const res = await deleteHomeSlideAction({
        id: targetId,
        deleteCloudinaryAsset: deleteCloudinary,
      });
      if (res.ok) {
        setSlides((prev) => prev.filter((s) => s.id !== targetId));
      }
      setDeleteTarget(null);
      setDeleteCloudinary(false);
    });
  }

  // Delete all handler
  function handleDeleteAll() {
    setFeedbackMessage(null);
    startTransition(async () => {
      const res = await deleteAllHomeSlidesAction({
        deleteCloudinaryAssets: deleteAllCloudinary,
      });
      if (res.ok) {
        setSlides([]);
        setDeleteAllModalOpen(false);
        setFeedbackMessage({
          type: "success",
          text: `Successfully deleted all ${res.data.deletedCount} slide${res.data.deletedCount === 1 ? "" : "s"}.`,
        });
      } else {
        setFeedbackMessage({
          type: "error",
          text: res.error.message,
        });
      }
      setDeleteAllCloudinary(false);
    });
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Home page image slider
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Manage the continuous photo showcase on the homepage ({slides.length} total, {activeCount} active).
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {slides.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDeleteAllCloudinary(false);
                setDeleteAllModalOpen(true);
              }}
              disabled={isPending}
              className="border border-danger/40 text-danger hover:border-danger hover:bg-danger/10"
            >
              <Trash2 size={16} className="mr-1.5" aria-hidden="true" />
              Delete all
            </Button>
          )}
          <Button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2"
          >
            <Plus size={18} aria-hidden="true" />
            Add images
          </Button>
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`flex items-start gap-3 rounded-card border p-4 text-sm shadow-soft ${
            feedbackMessage.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-red-300 bg-red-50 text-red-900"
          }`}
        >
          <Info className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
          <div className="flex-1 font-medium">{feedbackMessage.text}</div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Guidance Banners */}
      <div className="space-y-3">
        {activeCount < 10 && (
          <div className="flex items-start gap-3 rounded-card border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-soft">
            <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={19} aria-hidden="true" />
            <div className="text-sm">
              <span className="font-semibold">Smooth loop guidance: </span>
              Add at least 10 active images for a smooth loop. You currently have {activeCount} active{" "}
              {activeCount === 1 ? "image" : "images"}.
            </div>
          </div>
        )}

        {hasSamplePhotos && (
          <div className="flex items-start gap-3 rounded-card border border-blue-200 bg-blue-50 p-4 text-blue-900 shadow-soft">
            <Info className="mt-0.5 shrink-0 text-blue-600" size={19} aria-hidden="true" />
            <div className="text-sm">
              <span className="font-semibold">Stock photos in use: </span>
              Sample photos are stock images. Replace them with your own project photos before launch.
            </div>
          </div>
        )}
      </div>

      {/* Settings Card */}
      <Card className="border-line bg-surface p-5">
        <h2 className="font-heading text-base font-semibold text-ink">Showcase presentation settings</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Configure optional heading text, marquee movement speed and hover behaviors.
        </p>

        <form onSubmit={handleSaveSettings} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="setting-eyebrow" className="block text-xs font-semibold text-ink">
                Eyebrow (optional)
              </label>
              <input
                id="setting-eyebrow"
                type="text"
                value={settings.eyebrow ?? ""}
                onChange={(e) => setSettings({ ...settings, eyebrow: e.target.value })}
                placeholder="e.g. Proven Field Experience"
                className="mt-1 w-full rounded-control border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-brand-deep"
              />
            </div>
            <div>
              <label htmlFor="setting-heading" className="block text-xs font-semibold text-ink">
                Heading (optional)
              </label>
              <input
                id="setting-heading"
                type="text"
                value={settings.heading ?? ""}
                onChange={(e) => setSettings({ ...settings, heading: e.target.value })}
                placeholder="e.g. Work in Progress & Completed Sites"
                className="mt-1 w-full rounded-control border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-brand-deep"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-1">
            <div>
              <label htmlFor="setting-speed" className="block text-xs font-semibold text-ink">
                Scroll speed
              </label>
              <select
                id="setting-speed"
                value={settings.speed}
                onChange={(e) => setSettings({ ...settings, speed: e.target.value as "slow" | "normal" | "fast" })}
                className="mt-1 rounded-control border border-line bg-bg px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-brand-deep"
              >
                <option value="slow">Slow (30 px/s)</option>
                <option value="normal">Normal (50 px/s)</option>
                <option value="fast">Fast (80 px/s)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-5">
              <label htmlFor="setting-pause" className="flex items-center gap-2 text-sm font-medium text-ink cursor-pointer">
                <input
                  id="setting-pause"
                  type="checkbox"
                  checked={settings.pauseOnHover}
                  onChange={(e) => setSettings({ ...settings, pauseOnHover: e.target.checked })}
                  className="rounded border-line text-brand focus:ring-brand"
                />
                Pause on hover
              </label>
            </div>

            <div className="pt-5">
              <Button type="submit" size="sm" loading={isPending}>
                Save settings
              </Button>
            </div>
          </div>

          {settingsMessage && (
            <p className="text-xs font-medium text-emerald-700" role="status">
              {settingsMessage}
            </p>
          )}
        </form>
      </Card>

      {/* Slide Table / Cards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-ink">Slides ({slides.length})</h2>
          {slides.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setDeleteAllCloudinary(false);
                setDeleteAllModalOpen(true);
              }}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-danger hover:underline disabled:opacity-50"
            >
              <Trash2 size={13} aria-hidden="true" />
              Delete all slides
            </button>
          )}
        </div>

        {slides.length === 0 ? (
          <div className="rounded-panel border border-dashed border-line p-10 text-center">
            <p className="text-sm text-ink-muted">No slides found in the home slider yet.</p>
            <Button
              type="button"
              onClick={() => setAddModalOpen(true)}
              variant="secondary"
              className="mt-4"
            >
              Add first image
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-panel border border-line bg-surface shadow-soft">
            <div className="hidden md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-bg text-xs font-semibold text-ink-muted">
                  <tr>
                    <th scope="col" className="w-12 px-3 py-3">
                      Order
                    </th>
                    <th scope="col" className="w-24 px-3 py-3">
                      Photo
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Title & Alt Text
                    </th>
                    <th scope="col" className="w-32 px-3 py-3">
                      Link URL
                    </th>
                    <th scope="col" className="w-28 px-3 py-3 text-center">
                      Status
                    </th>
                    <th scope="col" className="w-24 px-3 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {slides.map((slide, index) => (
                    <tr
                      key={slide.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`transition-colors hover:bg-bg/60 ${draggedIndex === index ? "opacity-40" : ""}`}
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <span
                            className="cursor-grab text-ink-muted hover:text-ink"
                            title="Drag to reorder"
                          >
                            <GripVertical size={16} />
                          </span>
                          <div className="flex flex-col">
                            <button
                              type="button"
                              disabled={index === 0 || isPending}
                              onClick={() => handleMove(slide.id, "up")}
                              aria-label={`Move slide ${index + 1} up`}
                              className="rounded p-0.5 text-ink-muted hover:text-ink disabled:opacity-30"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              type="button"
                              disabled={index === slides.length - 1 || isPending}
                              onClick={() => handleMove(slide.id, "down")}
                              aria-label={`Move slide ${index + 1} down`}
                              className="rounded p-0.5 text-ink-muted hover:text-ink disabled:opacity-30"
                            >
                              <ArrowDown size={12} />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="relative aspect-4/3 w-20 overflow-hidden rounded-control border border-line bg-tint">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={slide.media.url}
                            alt={slide.alt}
                            className="size-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ink">
                            {slide.title || slide.alt}
                          </span>
                          {slide.isPlaceholder && (
                            <Badge variant="warning" className="text-[10px]">
                              Sample photo
                            </Badge>
                          )}
                        </div>
                        {slide.title && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">
                            Alt: {slide.alt}
                          </p>
                        )}
                        {slide.caption && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted italic">
                            Caption: {slide.caption}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {slide.linkUrl ? (
                          <span className="truncate text-xs font-mono text-brand-deep">
                            {slide.linkUrl}
                          </span>
                        ) : (
                          <span className="text-xs text-ink-muted/50">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Switch
                          checked={slide.isActive}
                          onCheckedChange={() => handleToggleActive(slide)}
                          aria-label={`Toggle active state for ${slide.title || slide.alt}`}
                        />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(slide)}
                            aria-label={`Edit ${slide.title || slide.alt}`}
                            className="rounded-control p-1.5 text-ink-muted hover:bg-surface-alt hover:text-ink"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(slide)}
                            aria-label={`Delete ${slide.title || slide.alt}`}
                            className="rounded-control p-1.5 text-danger hover:bg-danger/10"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="divide-y divide-line md:hidden">
              {slides.map((slide, index) => (
                <div key={slide.id} className="flex flex-col gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <div className="relative aspect-4/3 w-24 shrink-0 overflow-hidden rounded-control border border-line bg-tint">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slide.media.url}
                        alt={slide.alt}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-ink text-sm">
                          {slide.title || slide.alt}
                        </span>
                        {slide.isPlaceholder && (
                          <Badge variant="warning" className="text-[10px]">
                            Sample
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
                        {slide.alt}
                      </p>
                      {slide.linkUrl && (
                        <p className="mt-1 truncate text-xs font-mono text-brand-deep">
                          {slide.linkUrl}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-line/60 pt-2 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={index === 0 || isPending}
                        onClick={() => handleMove(slide.id, "up")}
                        className="rounded border border-line px-2 py-1 text-ink-muted hover:text-ink disabled:opacity-30"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        disabled={index === slides.length - 1 || isPending}
                        onClick={() => handleMove(slide.id, "down")}
                        className="rounded border border-line px-2 py-1 text-ink-muted hover:text-ink disabled:opacity-30"
                      >
                        Down
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <span className="text-xs text-ink-muted">Active</span>
                        <Switch
                          checked={slide.isActive}
                          onCheckedChange={() => handleToggleActive(slide)}
                          aria-label={`Toggle active state for ${slide.title || slide.alt}`}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => openEdit(slide)}
                        className="rounded p-1 text-ink-muted hover:text-ink"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(slide)}
                        className="rounded p-1 text-danger hover:bg-danger/10"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Images Modal */}
      <Dialog
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add slides to home slider"
        description="Upload images to the home section, then configure their labels."
      >
        <DialogPanel>
          <div className="space-y-6">
            <SectionUploader
              section="home"
              multiple
              onUploaded={handleAssetUploaded}
              title="Upload photos"
              previewAspect="4/3"
            />

            {draftUploads.length > 0 && (
              <div className="space-y-4 border-t border-line pt-4">
                <h3 className="font-heading text-sm font-semibold text-ink">
                  New slides ready to save ({draftUploads.length})
                </h3>
                <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                  {draftUploads.map((draft, idx) => (
                    <div
                      key={draft.asset.id}
                      className="flex gap-3 rounded-card border border-line bg-surface p-3"
                    >
                      <div className="relative aspect-4/3 w-20 shrink-0 overflow-hidden rounded-control border border-line">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={draft.asset.url}
                          alt={draft.alt}
                          className="size-full object-cover"
                        />
                      </div>
                      <div className="grid flex-1 gap-2 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-ink">
                            Alt text <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={draft.alt}
                            onChange={(e) =>
                              setDraftUploads((all) =>
                                all.map((d, i) => (i === idx ? { ...d, alt: e.target.value } : d)),
                              )
                            }
                            className="mt-0.5 w-full rounded-control border border-line bg-bg px-2.5 py-1.5 text-xs text-ink"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-ink">
                            Title (optional)
                          </label>
                          <input
                            type="text"
                            value={draft.title}
                            onChange={(e) =>
                              setDraftUploads((all) =>
                                all.map((d, i) => (i === idx ? { ...d, title: e.target.value } : d)),
                              )
                            }
                            className="mt-0.5 w-full rounded-control border border-line bg-bg px-2.5 py-1.5 text-xs text-ink"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-ink">
                            Link URL (optional)
                          </label>
                          <input
                            type="text"
                            placeholder="/projects or https://..."
                            value={draft.linkUrl}
                            onChange={(e) =>
                              setDraftUploads((all) =>
                                all.map((d, i) => (i === idx ? { ...d, linkUrl: e.target.value } : d)),
                              )
                            }
                            className="mt-0.5 w-full rounded-control border border-line bg-bg px-2.5 py-1.5 text-xs text-ink"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-line pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setDraftUploads([]);
                  setAddModalOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={draftUploads.length === 0}
                loading={isPending}
                onClick={handleSaveNewUploads}
              >
                Save {draftUploads.length} {draftUploads.length === 1 ? "slide" : "slides"}
              </Button>
            </div>
          </div>
        </DialogPanel>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={Boolean(editingSlide)}
        onClose={() => setEditingSlide(null)}
        title="Edit slide"
        description="Update slide details, link or replace the image."
      >
        <DialogPanel>
          {editingSlide && (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative aspect-4/3 w-28 shrink-0 overflow-hidden rounded-control border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      editForm.mediaId === editingSlide.mediaId
                        ? editingSlide.media.url
                        : editingSlide.media.url
                    }
                    alt={editForm.alt}
                    className="size-full object-cover"
                  />
                </div>
                <div className="flex-1 text-xs text-ink-muted">
                  <p className="font-semibold text-ink">Current photo</p>
                  <p>{editingSlide.media.publicId}</p>
                  <div className="mt-2">
                    <SectionUploader
                      section="home"
                      multiple={false}
                      onUploaded={(asset) => setEditForm({ ...editForm, mediaId: asset.id })}
                      title="Replace photo"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">
                  Alt text <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.alt}
                  onChange={(e) => setEditForm({ ...editForm, alt: e.target.value })}
                  className="mt-1 w-full rounded-control border border-line bg-bg px-3 py-2 text-sm text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="mt-1 w-full rounded-control border border-line bg-bg px-3 py-2 text-sm text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">
                  Caption (optional)
                </label>
                <input
                  type="text"
                  value={editForm.caption}
                  onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
                  className="mt-1 w-full rounded-control border border-line bg-bg px-3 py-2 text-sm text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">
                  Link URL (optional)
                </label>
                <input
                  type="text"
                  placeholder="/projects or https://..."
                  value={editForm.linkUrl}
                  onChange={(e) => setEditForm({ ...editForm, linkUrl: e.target.value })}
                  className="mt-1 w-full rounded-control border border-line bg-bg px-3 py-2 text-sm text-ink"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={editForm.isActive}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
                  aria-label="Active status"
                />
                <span className="text-sm font-medium text-ink">Show in slider</span>
              </div>

              <div className="flex justify-end gap-3 border-t border-line pt-4">
                <Button type="button" variant="secondary" onClick={() => setEditingSlide(null)}>
                  Cancel
                </Button>
                <Button type="submit" loading={isPending}>
                  Save changes
                </Button>
              </div>
            </form>
          )}
        </DialogPanel>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete slide?"
        description={`Are you sure you want to delete "${deleteTarget?.title || deleteTarget?.alt}"? This action cannot be undone.`}
        center
      >
        <DialogPanel>
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-xs font-medium text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={deleteCloudinary}
                onChange={(e) => setDeleteCloudinary(e.target.checked)}
                className="rounded border-line text-brand focus:ring-brand"
              />
              Also delete image file from Cloudinary (if not used elsewhere)
            </label>

            <div className="flex justify-center gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                className="bg-red-600 text-white hover:bg-red-700 hover:text-white"
                loading={isPending}
                onClick={handleDeleteConfirm}
              >
                Delete slide
              </Button>
            </div>
          </div>
        </DialogPanel>
      </Dialog>

      {/* Delete All Confirmation Dialog */}
      <Dialog
        open={deleteAllModalOpen}
        onClose={() => !isPending && setDeleteAllModalOpen(false)}
        title="Delete all slides?"
        description={`Are you sure you want to delete all ${slides.length} slides from the home page image slider? This action cannot be undone.`}
        center
      >
        <DialogPanel>
          <div className="space-y-4">
            <label className="flex items-start gap-2.5 rounded-control border border-line bg-bg p-3 text-xs text-ink cursor-pointer hover:border-line-strong">
              <input
                type="checkbox"
                checked={deleteAllCloudinary}
                onChange={(e) => setDeleteAllCloudinary(e.target.checked)}
                className="mt-0.5 rounded border-line text-brand focus:ring-brand"
              />
              <span>
                Also delete associated Cloudinary media assets that are not used anywhere else (best-effort cleanup).
              </span>
            </label>

            <div className="flex justify-center gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isPending}
                onClick={() => setDeleteAllModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                className="bg-red-600 text-white hover:bg-red-700 hover:text-white"
                loading={isPending}
                onClick={handleDeleteAll}
              >
                {isPending ? "Deleting all..." : `Yes, delete all (${slides.length})`}
              </Button>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </div>
  );
}

