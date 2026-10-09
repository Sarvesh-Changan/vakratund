"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createTestimonial, updateTestimonial } from "@/app/(admin)/admin/(protected)/testimonials/actions";
import { FormSection } from "@/components/admin/form-section";
import { Button, FormField, Input, Select, Textarea } from "@/components/ui";
import type { CreateTestimonialInput } from "@/lib/validation/testimonials";
import type { TestimonialView } from "@/server/services/testimonials";

type TestimonialFormState = CreateTestimonialInput;
type ProjectOption = { id: string; title: string };

const blank: TestimonialFormState = { name: "", roleOrOrg: "", quote: "", rating: null, projectId: null, status: "DRAFT", sortOrder: 0 };

function initialState(initial: TestimonialView | null): TestimonialFormState {
  if (!initial) return blank;
  return { name: initial.name, roleOrOrg: initial.roleOrOrg ?? "", quote: initial.quote, rating: initial.rating, projectId: initial.projectId, status: initial.status, sortOrder: initial.sortOrder };
}

function errorFor(errors: Record<string, string[]>, field: string): string | undefined { return errors[field]?.[0]; }

export function TestimonialForm({ initial, projects }: { initial: TestimonialView | null; projects: readonly ProjectOption[] }) {
  const router = useRouter();
  const [form, setForm] = useState(() => initialState(initial));
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initial);
  function setField<K extends keyof TestimonialFormState>(field: K, value: TestimonialFormState[K]) { setForm((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: [] })); }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage(null); setErrors({});
    const result = isEdit && initial ? await updateTestimonial({ ...form, id: initial.id }) : await createTestimonial(form);
    setSaving(false);
    if (!result.ok) { setErrors(result.error.fieldErrors ?? {}); setMessage(result.error.message); return; }
    router.push("/admin/testimonials"); router.refresh();
  }
  return <form onSubmit={submit} className="space-y-6">{message ? <p role="alert" className="rounded-control border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{message}</p> : null}
    <FormSection title="Testimonial" description="Keep the quote faithful to the approved customer wording. HTML is not accepted."><div className="grid gap-5 md:grid-cols-2"><FormField label="Name" htmlFor="name" required error={errorFor(errors, "name")}><Input id="name" value={form.name} onChange={(event) => setField("name", event.target.value)} /></FormField><FormField label="Role or organisation" htmlFor="roleOrOrg" hint="Optional, for example Secretary, XYZ CHSL." error={errorFor(errors, "roleOrOrg")}><Input id="roleOrOrg" value={form.roleOrOrg} onChange={(event) => setField("roleOrOrg", event.target.value)} /></FormField></div><FormField label="Quote" htmlFor="quote" required error={errorFor(errors, "quote")}><Textarea id="quote" rows={6} value={form.quote} onChange={(event) => setField("quote", event.target.value)} /></FormField></FormSection>
    <FormSection title="Context" description="A testimonial may optionally be linked to a project and rated from one to five."><div className="grid gap-5 md:grid-cols-3"><FormField label="Rating" htmlFor="rating" hint="Optional, from 1 to 5." error={errorFor(errors, "rating")}><Select id="rating" value={form.rating?.toString() ?? ""} onChange={(event) => setField("rating", event.target.value ? Number(event.target.value) : null)}><option value="">No rating</option>{[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}</Select></FormField><FormField label="Project link" htmlFor="projectId" hint="Optional public project reference." error={errorFor(errors, "projectId")}><Select id="projectId" value={form.projectId ?? ""} onChange={(event) => setField("projectId", event.target.value || null)}><option value="">No project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</Select></FormField><FormField label="Order" htmlFor="sortOrder" hint="Lower numbers appear first." error={errorFor(errors, "sortOrder")}><Input id="sortOrder" type="number" min={0} value={form.sortOrder} onChange={(event) => setField("sortOrder", Number(event.target.value))} /></FormField></div></FormSection>
    <FormSection title="Publication"><FormField label="Status" htmlFor="status" required error={errorFor(errors, "status")}><Select id="status" value={form.status} onChange={(event) => setField("status", event.target.value as TestimonialFormState["status"])}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></Select></FormField></FormSection>
    <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button><Button type="submit" loading={saving}>{isEdit ? "Save testimonial" : "Create testimonial"}</Button></div>
  </form>;
}
