"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, Checkbox, FormField, Input, Select, Textarea } from "@/components/ui";
import { FormSection } from "@/components/admin/form-section";
import { MediaPicker, type MediaPickerAsset } from "@/components/admin/media-picker";
import { ServiceIcon, serviceIcons } from "@/components/admin/service-icon";
import { ServiceMarkdownEditor } from "@/components/admin/service-markdown-editor";
import { createService, updateService } from "@/app/(admin)/admin/(protected)/services/actions";
import { SERVICE_ICON_KEYS, type CreateServiceInput } from "@/lib/validation/services";
import type { ServiceView } from "@/server/services/services";

type ServiceFormState = CreateServiceInput;

const blankService: ServiceFormState = {
  title: "",
  slug: "",
  shortDesc: "",
  description: "",
  scopeItems: [""],
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
    shortDesc: initial.shortDesc,
    description: initial.description,
    scopeItems: initial.scopeItems,
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

export function ServiceForm({ initial, assets }: { initial: ServiceView | null; assets: readonly MediaPickerAsset[] }) {
  const router = useRouter();
  const [form, setForm] = useState(() => initialState(initial));
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initial);

  const previewTitle = form.seoTitle || form.title || "Service title";
  const previewDescription = form.seoDesc || form.shortDesc || "Your service description will appear here.";
  const previewSlug = form.slug || "service-slug";
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
    router.push("/admin/services");
    router.refresh();
  }

  return <form onSubmit={submit} className="space-y-6">
    {message ? <p role="alert" className="rounded-control border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{message}</p> : null}
    <FormSection title="Identity" description="The title and slug define how this service is found on the public website.">
      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Title" htmlFor="title" required error={fieldError(errors, "title")}><Input id="title" value={form.title} onChange={(event) => setField("title", event.target.value)} aria-invalid={Boolean(fieldError(errors, "title"))} /></FormField>
        <FormField label="Slug" htmlFor="slug" hint="Leave blank to generate it from the title." error={fieldError(errors, "slug")}><Input id="slug" value={form.slug} onChange={(event) => setField("slug", event.target.value)} aria-invalid={Boolean(fieldError(errors, "slug"))} /></FormField>
      </div>
      <FormField label="Short description" htmlFor="shortDesc" required error={fieldError(errors, "shortDesc")}><Textarea id="shortDesc" rows={3} value={form.shortDesc} onChange={(event) => setField("shortDesc", event.target.value)} aria-invalid={Boolean(fieldError(errors, "shortDesc"))} /></FormField>
    </FormSection>

    <FormSection title="Description" description="Use Markdown for headings, emphasis, lists, and safe links. Raw HTML is removed in the preview and public renderer.">
      <FormField label="Markdown description" htmlFor="description" required error={fieldError(errors, "description")}><ServiceMarkdownEditor value={form.description} onChange={(value) => setField("description", value)} /></FormField>
      <div className="space-y-3"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Scope bullets</h3><Button type="button" size="sm" variant="secondary" onClick={addScopeItem}>Add bullet</Button></div>{form.scopeItems.map((item, index) => <div className="flex gap-2" key={`scope-${index}`}><Input value={item} onChange={(event) => setScopeItem(index, event.target.value)} aria-label={`Scope bullet ${index + 1}`} /><Button type="button" size="sm" variant="ghost" onClick={() => removeScopeItem(index)} aria-label={`Remove scope bullet ${index + 1}`}>Remove</Button></div>)}{fieldError(errors, "scopeItems") ? <p className="text-sm text-danger" role="alert">{fieldError(errors, "scopeItems")}</p> : null}</div>
    </FormSection>

    <FormSection title="Presentation" description="Choose a recognizable Lucide icon and a Cloudinary image from the media library.">
      <fieldset><legend className="text-sm font-semibold">Icon</legend><div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">{SERVICE_ICON_KEYS.map((key) => { const Icon = serviceIcons[key]; const selected = form.iconKey === key; return <button type="button" key={key} onClick={() => setField("iconKey", key)} aria-pressed={selected} className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-control border p-2 text-xs ${selected ? "border-brand-deep bg-brand/10" : "hover:bg-surface-alt"}`}><Icon size={22} aria-hidden="true" /><span>{key}</span></button>; })}</div></fieldset>
      <MediaPicker assets={assets} value={form.coverId} onChange={(value) => setField("coverId", typeof value === "string" ? value : null)} label="Cover image" />
      {selectedIcon ? <p className="flex items-center gap-2 text-sm text-ink-muted"><ServiceIcon iconKey={form.iconKey} /> Selected icon: {form.iconKey}</p> : null}
      <label className="flex items-center gap-3 text-sm font-semibold"><Checkbox checked={form.isFeatured} onChange={(event) => setField("isFeatured", event.target.checked)} /> Feature this service on the homepage</label>
    </FormSection>

    <FormSection title="Publication and ordering">
      <div className="grid gap-5 md:grid-cols-2"><FormField label="Status" htmlFor="status" required error={fieldError(errors, "status")}><Select id="status" value={form.status} onChange={(event) => setField("status", event.target.value as ServiceFormState["status"])}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></Select></FormField><FormField label="Order" htmlFor="sortOrder" hint="Lower numbers appear first." error={fieldError(errors, "sortOrder")}><Input id="sortOrder" type="number" min={0} value={form.sortOrder} onChange={(event) => setField("sortOrder", Number(event.target.value))} /></FormField></div>
    </FormSection>

    <FormSection title="Search appearance" description="Search engines may truncate longer values. Keep the important wording at the beginning.">
      <div className="grid gap-5 md:grid-cols-2"><FormField label="SEO title" htmlFor="seoTitle" hint={`${form.seoTitle?.length ?? 0}/60 characters`} error={fieldError(errors, "seoTitle")}><Input id="seoTitle" maxLength={60} value={form.seoTitle} onChange={(event) => setField("seoTitle", event.target.value)} /></FormField><FormField label="SEO description" htmlFor="seoDesc" hint={`${form.seoDesc?.length ?? 0}/160 characters`} error={fieldError(errors, "seoDesc")}><Textarea id="seoDesc" maxLength={160} rows={3} value={form.seoDesc} onChange={(event) => setField("seoDesc", event.target.value)} /></FormField></div>
      <div className="rounded-control border bg-surface-alt p-4"><p className="text-xs text-ink-muted">Search preview</p><p className="mt-2 truncate text-lg text-blue-700">{previewTitle}</p><p className="truncate text-sm text-success">https://vakratund.example/services/{previewSlug}</p><p className="mt-1 text-sm text-ink-muted">{previewDescription}</p></div>
    </FormSection>

    <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button><Button type="submit" loading={saving}>{isEdit ? "Save service" : "Create service"}</Button></div>
  </form>;
}
