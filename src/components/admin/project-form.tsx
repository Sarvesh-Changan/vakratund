"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createProject, updateProject } from "@/app/(admin)/admin/(protected)/projects/actions";
import { ProjectMediaEditor } from "@/components/admin/project-media-editor";
import { FormSection } from "@/components/admin/form-section";
import type { MediaPickerAsset } from "@/components/admin/media-picker";
import { Button, Checkbox, FormField, Input, Select, Textarea } from "@/components/ui";
import type { CreateProjectInput } from "@/lib/validation/projects";
import type { ProjectView } from "@/server/services/projects";

type ProjectFormState = CreateProjectInput;
type ServiceOption = { id: string; title: string };

const blankProject: ProjectFormState = {
  title: "",
  slug: "",
  summary: "",
  description: "",
  serviceId: null,
  clientName: "",
  showClientName: false,
  locationText: "",
  areaSqft: null,
  floorsText: "",
  scopeText: "",
  year: null,
  status: "COMPLETED",
  progressPct: null,
  isFeatured: false,
  publishStatus: "DRAFT",
  sortOrder: 0,
  seoTitle: "",
  seoDesc: "",
  media: [],
};

function initialState(initial: ProjectView | null): ProjectFormState {
  if (!initial) return blankProject;
  return {
    title: initial.title,
    slug: initial.slug,
    summary: initial.summary,
    description: initial.description ?? "",
    serviceId: initial.serviceId,
    clientName: initial.clientName ?? "",
    showClientName: initial.showClientName,
    locationText: initial.locationText ?? "",
    areaSqft: initial.areaSqft,
    floorsText: initial.floorsText ?? "",
    scopeText: initial.scopeText ?? "",
    year: initial.year,
    status: initial.status,
    progressPct: initial.progressPct,
    isFeatured: initial.isFeatured,
    publishStatus: initial.publishStatus,
    sortOrder: initial.sortOrder,
    seoTitle: initial.seoTitle ?? "",
    seoDesc: initial.seoDesc ?? "",
    media: initial.media.map(({ mediaId, isCover, isBefore, isAfter, sortOrder }) => ({ mediaId, isCover, isBefore, isAfter, sortOrder })),
  };
}

function fieldError(errors: Record<string, string[]>, field: string): string | undefined { return errors[field]?.[0]; }

export function ProjectForm({ initial, assets, services }: { initial: ProjectView | null; assets: readonly MediaPickerAsset[]; services: readonly ServiceOption[] }) {
  const router = useRouter();
  const [form, setForm] = useState(() => initialState(initial));
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initial);

  function setField<K extends keyof ProjectFormState>(field: K, value: ProjectFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: [] }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setErrors({});
    const result = isEdit && initial ? await updateProject({ ...form, id: initial.id }) : await createProject(form);
    setSaving(false);
    if (!result.ok) {
      setErrors(result.error.fieldErrors ?? {});
      setMessage(result.error.message);
      return;
    }
    router.push("/admin/projects");
    router.refresh();
  }

  const previewTitle = form.seoTitle || form.title || "Project title";
  const previewDescription = form.seoDesc || form.summary || "Your project summary will appear here.";

  return <form onSubmit={submit} className="space-y-6">
    {message ? <p role="alert" className="rounded-control border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{message}</p> : null}
    <FormSection title="Project identity" description="The title, summary, and slug are used on the public project detail page.">
      <div className="grid gap-5 md:grid-cols-2"><FormField label="Title" htmlFor="title" required error={fieldError(errors, "title")}><Input id="title" value={form.title} onChange={(event) => setField("title", event.target.value)} /></FormField><FormField label="Slug" htmlFor="slug" hint="Leave blank to generate it from the title." error={fieldError(errors, "slug")}><Input id="slug" value={form.slug} onChange={(event) => setField("slug", event.target.value)} /></FormField></div>
      <FormField label="Summary" htmlFor="summary" required error={fieldError(errors, "summary")}><Textarea id="summary" rows={3} value={form.summary} onChange={(event) => setField("summary", event.target.value)} /></FormField>
      <FormField label="Description" htmlFor="description" hint="Optional Markdown description. Raw HTML is not allowed."><Textarea id="description" rows={6} value={form.description} onChange={(event) => setField("description", event.target.value)} /></FormField>
    </FormSection>

    <FormSection title="Project details" description="Use the client-approved facts from the project record. Blank fields stay hidden publicly.">
      <div className="grid gap-5 md:grid-cols-2"><FormField label="Service" htmlFor="serviceId" error={fieldError(errors, "serviceId")}><Select id="serviceId" value={form.serviceId ?? ""} onChange={(event) => setField("serviceId", event.target.value || null)}><option value="">No service relation</option>{services.map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}</Select></FormField><FormField label="Location" htmlFor="locationText" error={fieldError(errors, "locationText")}><Input id="locationText" value={form.locationText} onChange={(event) => setField("locationText", event.target.value)} placeholder="e.g. Thane (W)" /></FormField></div>
      <div className="grid gap-5 md:grid-cols-3"><FormField label="Area (sq. ft.)" htmlFor="areaSqft" error={fieldError(errors, "areaSqft")}><Input id="areaSqft" type="number" min={1} value={form.areaSqft ?? ""} onChange={(event) => setField("areaSqft", event.target.value ? Number(event.target.value) : null)} /></FormField><FormField label="Floors" htmlFor="floorsText" error={fieldError(errors, "floorsText")}><Input id="floorsText" value={form.floorsText} onChange={(event) => setField("floorsText", event.target.value)} placeholder="Stilt + 9 floors" /></FormField><FormField label="Year" htmlFor="year" error={fieldError(errors, "year")}><Input id="year" type="number" min={1900} max={2200} value={form.year ?? ""} onChange={(event) => setField("year", event.target.value ? Number(event.target.value) : null)} /></FormField></div>
      <div className="grid gap-5 md:grid-cols-2"><FormField label="Scope" htmlFor="scopeText" error={fieldError(errors, "scopeText")}><Input id="scopeText" value={form.scopeText} onChange={(event) => setField("scopeText", event.target.value)} placeholder="PMC & Turnkey" /></FormField><FormField label="Completion status" htmlFor="status" required error={fieldError(errors, "status")}><Select id="status" value={form.status} onChange={(event) => { const status = event.target.value as ProjectFormState["status"]; setField("status", status); if (status === "COMPLETED") setField("progressPct", null); }}><option value="COMPLETED">Completed</option><option value="ONGOING">Ongoing</option></Select></FormField></div>
      {form.status === "ONGOING" ? <FormField label="Progress (%)" htmlFor="progressPct" required hint="Required for ongoing projects; use 0–100." error={fieldError(errors, "progressPct")}><Input id="progressPct" type="number" min={0} max={100} value={form.progressPct ?? ""} onChange={(event) => setField("progressPct", event.target.value ? Number(event.target.value) : null)} /></FormField> : null}
      <div className="space-y-2"><label className="flex items-start gap-3 text-sm font-semibold"><Checkbox checked={form.showClientName} onChange={(event) => setField("showClientName", event.target.checked)} /><span>Show client name publicly<p className="mt-1 font-normal text-ink-muted">Keep this off unless the client has given explicit permission to publish their name.</p></span></label><FormField label="Client name" htmlFor="clientName" error={fieldError(errors, "clientName")}><Input id="clientName" value={form.clientName} onChange={(event) => setField("clientName", event.target.value)} /></FormField></div>
    </FormSection>

    <FormSection title="Media" description="Upload images or videos to this project’s fixed Cloudinary folder. A published project needs at least one image."><ProjectMediaEditor assets={assets} entityTitle={form.title} value={form.media} onChange={(media) => setField("media", media)} error={fieldError(errors, "media")} /></FormSection>

    <FormSection title="Publication and ordering"><div className="grid gap-5 md:grid-cols-3"><FormField label="Publish status" htmlFor="publishStatus" required error={fieldError(errors, "publishStatus")}><Select id="publishStatus" value={form.publishStatus} onChange={(event) => setField("publishStatus", event.target.value as ProjectFormState["publishStatus"])}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></Select></FormField><FormField label="Order" htmlFor="sortOrder" hint="Lower numbers appear first." error={fieldError(errors, "sortOrder")}><Input id="sortOrder" type="number" min={0} value={form.sortOrder} onChange={(event) => setField("sortOrder", Number(event.target.value))} /></FormField><label className="flex items-center gap-3 self-end pb-2 text-sm font-semibold"><Checkbox checked={form.isFeatured} onChange={(event) => setField("isFeatured", event.target.checked)} /> Feature project</label></div></FormSection>

    <FormSection title="Search appearance" description="Search engines may truncate longer values. Keep the important wording at the beginning."><div className="grid gap-5 md:grid-cols-2"><FormField label="SEO title" htmlFor="seoTitle" hint={`${form.seoTitle?.length ?? 0}/60 characters`} error={fieldError(errors, "seoTitle")}><Input id="seoTitle" maxLength={60} value={form.seoTitle} onChange={(event) => setField("seoTitle", event.target.value)} /></FormField><FormField label="SEO description" htmlFor="seoDesc" hint={`${form.seoDesc?.length ?? 0}/160 characters`} error={fieldError(errors, "seoDesc")}><Textarea id="seoDesc" maxLength={160} rows={3} value={form.seoDesc} onChange={(event) => setField("seoDesc", event.target.value)} /></FormField></div><div className="rounded-control border bg-surface-alt p-4"><p className="text-xs text-ink-muted">Search preview</p><p className="mt-2 truncate text-lg text-blue-700">{previewTitle}</p><p className="truncate text-sm text-success">https://vakratund.example/projects/{form.slug || "project-slug"}</p><p className="mt-1 text-sm text-ink-muted">{previewDescription}</p></div></FormSection>

    <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button><Button type="submit" loading={saving}>{isEdit ? "Save project" : "Create project"}</Button></div>
  </form>;
}

