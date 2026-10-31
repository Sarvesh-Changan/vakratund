"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, Checkbox, FormField, Input, Select, Textarea } from "@/components/ui";
import { FormSection } from "@/components/admin/form-section";
import { SectionUploader } from "@/components/admin/section-uploader";
import { CloudImage } from "@/components/cloud-image";
import type { MediaAssetView } from "@/server/services/media";
import { ServiceIcon, serviceIcons } from "@/components/admin/service-icon";
import { ServiceMarkdownEditor } from "@/components/admin/service-markdown-editor";
import { createService, updateService } from "@/app/(admin)/admin/(protected)/services/actions";
import { removeMediaAsset } from "@/app/(admin)/admin/(protected)/media/actions";
import { SERVICE_GROUPS, SERVICE_ICON_KEYS, type CreateServiceInput } from "@/lib/validation/services";
import type { ServiceView } from "@/server/services/services";

type ServiceFormState = CreateServiceInput;

const blankService: ServiceFormState = {
  title: "",
  slug: "",
  group: "",
  shortDesc: "",
  description: "",
  scopeItems: [""],
  processSteps: [],
  typicalProjects: "",
  audience: "",
  iconKey: "Building2",
  coverId: null,
  isFeatured: false,
  status: "DRAFT",
  sortOrder: 0,
  seoTitle: "",
  seoDesc: "",
};

function initialState(initial: ServiceView | null): ServiceFormState {
  if (!initial) return blankService;
  return {
    title: initial.title,
    slug: initial.slug,
    group: initial.group ?? "",
    shortDesc: initial.shortDesc,
    description: initial.description,
    scopeItems: initial.scopeItems,
    processSteps: initial.processSteps,
    typicalProjects: initial.typicalProjects ?? "",
    audience: initial.audience ?? "",
    iconKey: initial.iconKey as ServiceFormState["iconKey"],
    coverId: initial.coverId,
    isFeatured: initial.isFeatured,
    status: initial.status,
    sortOrder: initial.sortOrder,
    seoTitle: initial.seoTitle ?? "",
    seoDesc: initial.seoDesc ?? "",
  };
}

function fieldError(errors: Record<string, string[]>, field: string): string | undefined {
  return errors[field]?.[0];
}

export function ServiceForm({ initial, initialCover }: { initial: ServiceView | null; initialCover: MediaAssetView | null }) {
  const router = useRouter();
  const [form, setForm] = useState(() => initialState(initial));
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [cover, setCover] = useState<MediaAssetView | null>(initialCover);
  const isEdit = Boolean(initial);

  const selectedIcon = useMemo(() => form.iconKey && serviceIcons[form.iconKey], [form.iconKey]);

  function setField<K extends keyof ServiceFormState>(field: K, value: ServiceFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: [] }));
  }

  function setScopeItem(index: number, value: string) {
    setForm((current) => ({ ...current, scopeItems: current.scopeItems.map((item, itemIndex) => itemIndex === index ? value : item) }));
  }

  function addScopeItem() {
    setForm((current) => ({ ...current, scopeItems: [...current.scopeItems, ""] }));
  }

  function removeScopeItem(index: number) {
    setForm((current) => ({ ...current, scopeItems: current.scopeItems.filter((_, itemIndex) => itemIndex !== index) }));
  }

  function setProcessSteps(value: string) {
    setField("processSteps", value.split("\n").map((item) => item.trim()).filter(Boolean).slice(0, 8));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setErrors({});
    const result = isEdit && initial ? await updateService({ ...form, id: initial.id }) : await createService(form);
    setSaving(false);
    if (!result.ok) {
      setErrors(result.error.fieldErrors ?? {});
      setMessage(result.error.message);
      return;
    }
    if (initialCover && initialCover.id !== form.coverId && window.confirm("Delete the previous cover from the media library and Cloudinary if it is no longer used elsewhere?")) {
      const deletion = await removeMediaAsset({ id: initialCover.id });
      if (!deletion.ok || ("blocked" in deletion.data && deletion.data.blocked)) setMessage("Service saved. The previous image is still used elsewhere and was kept.");
    }
    router.push("/admin/services");
    router.refresh();
  }

  return <form onSubmit={submit} className="space-y-6">
    {message ? <p role="alert" className="rounded-control border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{message}</p> : null}
    <FormSection title="Identity" description="The title and slug define how this service is found on the public website.">
      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Title" htmlFor="title" required error={fieldError(errors, "title")}><Input id="title" value={form.title} onChange={(event) => setField("title", event.target.value)} aria-invalid={Boolean(fieldError(errors, "title"))} /></FormField>
        <FormField label="Slug" htmlFor="slug" hint="Leave blank to generate it from the title." error={fieldError(errors, "slug")}><Input id="slug" value={form.slug} onChange={(event) => setField("slug", event.target.value)} aria-invalid={Boolean(fieldError(errors, "slug"))} /></FormField>
        <FormField label="Service group" htmlFor="group" hint="Leave blank to show only under All." error={fieldError(errors, "group")}><Select id="group" value={form.group} onChange={(event) => setField("group", event.target.value)}><option value="">All only</option>{SERVICE_GROUPS.map((group) => <option value={group} key={group}>{group}</option>)}</Select></FormField>
      </div>
      <FormField label="Short description" htmlFor="shortDesc" required error={fieldError(errors, "shortDesc")}><Textarea id="shortDesc" rows={3} value={form.shortDesc} onChange={(event) => setField("shortDesc", event.target.value)} aria-invalid={Boolean(fieldError(errors, "shortDesc"))} /></FormField>
    </FormSection>

    <FormSection title="Description" description="Use Markdown for headings, emphasis, lists, and safe links. Raw HTML is removed in the preview and public renderer.">
      <FormField label="Markdown description" htmlFor="description" required error={fieldError(errors, "description")}><ServiceMarkdownEditor value={form.description} onChange={(value) => setField("description", value)} /></FormField>
      <div className="space-y-3"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Scope bullets</h3><Button type="button" size="sm" variant="secondary" onClick={addScopeItem}>Add bullet</Button></div>{form.scopeItems.map((item, index) => <div className="flex gap-2" key={`scope-${index}`}><Input value={item} onChange={(event) => setScopeItem(index, event.target.value)} aria-label={`Scope bullet ${index + 1}`} /><Button type="button" size="sm" variant="ghost" onClick={() => removeScopeItem(index)} aria-label={`Remove scope bullet ${index + 1}`}>Remove</Button></div>)}{fieldError(errors, "scopeItems") ? <p className="text-sm text-danger" role="alert">{fieldError(errors, "scopeItems")}</p> : null}</div>
      <div className="grid gap-5 md:grid-cols-2"><FormField label="Typical projects" htmlFor="typicalProjects" hint="Optional, verified service context." error={fieldError(errors, "typicalProjects")}><Textarea id="typicalProjects" rows={3} value={form.typicalProjects ?? ""} onChange={(event) => setField("typicalProjects", event.target.value)} /></FormField><FormField label="Who it is for" htmlFor="audience" hint="Optional, approved audience description." error={fieldError(errors, "audience")}><Textarea id="audience" rows={3} value={form.audience ?? ""} onChange={(event) => setField("audience", event.target.value)} /></FormField></div>
      <FormField label="How we work steps (one per line)" htmlFor="processSteps" hint="Leave blank to use the standard four-step strip." error={fieldError(errors, "processSteps")}><Textarea id="processSteps" rows={4} value={form.processSteps.join("\n")} onChange={(event) => setProcessSteps(event.target.value)} /></FormField>
    </FormSection>

    <FormSection title="Presentation" description="Choose a recognizable Lucide icon and upload a service cover image.">
      <fieldset><legend className="text-sm font-semibold">Icon</legend><div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">{SERVICE_ICON_KEYS.map((key) => { const Icon = serviceIcons[key]; const selected = form.iconKey === key; return <button type="button" key={key} onClick={() => setField("iconKey", key)} aria-pressed={selected} className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-control border p-2 text-xs ${selected ? "border-brand-deep bg-brand/10" : "hover:bg-surface-alt"}`}><Icon size={22} aria-hidden="true" /><span>{key}</span></button>; })}</div></fieldset>
      {cover ? <div className="max-w-2xl"><div className="relative aspect-video overflow-hidden rounded-card border border-line"><CloudImage src={cover.url} alt={cover.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" /></div>{cover.folder !== "vakratund/services" ? <p className="mt-2 text-sm text-ink-muted">This image is from the shared library. Upload a service image to replace it.</p> : null}<Button type="button" size="sm" variant="ghost" className="mt-2 text-danger" onClick={() => { if (window.confirm("Remove this service cover? You can optionally delete the old asset after saving if it is unused.")) { setField("coverId", null); setCover(null); } }}>Remove</Button></div> : null}
      <p className="text-xs text-ink-muted">Recommended size: 1600 × 900 px, landscape. Images up to 10 MB.</p>
      <SectionUploader section="services" multiple={false} previewAspect="4/3" title={cover ? "Replace cover image" : "Cover image"} defaultAlt={() => form.title.trim()} onUploaded={(asset) => { setField("coverId", asset.id); setCover(asset); }} />
      {fieldError(errors, "coverId") ? <p role="alert" className="text-sm text-danger">{fieldError(errors, "coverId")}</p> : null}
      {selectedIcon ? <p className="flex items-center gap-2 text-sm text-ink-muted"><ServiceIcon iconKey={form.iconKey} /> Selected icon: {form.iconKey}</p> : null}
      <label className="flex items-center gap-3 text-sm font-semibold"><Checkbox checked={form.isFeatured} onChange={(event) => setField("isFeatured", event.target.checked)} /> Feature this service on the homepage</label>
    </FormSection>

    <FormSection title="Publication and ordering">
      <div className="grid gap-5 md:grid-cols-2"><FormField label="Status" htmlFor="status" required error={fieldError(errors, "status")}><Select id="status" value={form.status} onChange={(event) => setField("status", event.target.value as ServiceFormState["status"])}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></Select></FormField><FormField label="Order" htmlFor="sortOrder" hint="Lower numbers appear first." error={fieldError(errors, "sortOrder")}><Input id="sortOrder" type="number" min={0} value={form.sortOrder} onChange={(event) => setField("sortOrder", Number(event.target.value))} /></FormField></div>
    </FormSection>

    <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button><Button type="submit" loading={saving}>{isEdit ? "Save service" : "Create service"}</Button></div>
  </form>;
}
