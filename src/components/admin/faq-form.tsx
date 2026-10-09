"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createFaq, updateFaq } from "@/app/(admin)/admin/(protected)/faqs/actions";
import { FormSection } from "@/components/admin/form-section";
import { MarkdownRenderer } from "@/lib/markdown/renderer";
import { Button, FormField, Input, Select, Textarea } from "@/components/ui";
import type { CreateFaqInput } from "@/lib/validation/faqs";
import type { FaqView } from "@/server/services/faqs";

type FaqFormState = CreateFaqInput;
type ServiceOption = { id: string; title: string };
const blank: FaqFormState = { question: "", answer: "", serviceId: null, status: "DRAFT", sortOrder: 0 };

function initialState(initial: FaqView | null): FaqFormState { return initial ? { question: initial.question, answer: initial.answer, serviceId: initial.serviceId, status: initial.status, sortOrder: initial.sortOrder } : blank; }
function errorFor(errors: Record<string, string[]>, field: string): string | undefined { return errors[field]?.[0]; }

export function FaqForm({ initial, services }: { initial: FaqView | null; services: readonly ServiceOption[] }) {
  const router = useRouter(); const [form, setForm] = useState(() => initialState(initial)); const [errors, setErrors] = useState<Record<string, string[]>>({}); const [message, setMessage] = useState<string | null>(null); const [saving, setSaving] = useState(false); const isEdit = Boolean(initial);
  function setField<K extends keyof FaqFormState>(field: K, value: FaqFormState[K]) { setForm((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: [] })); }
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setMessage(null); setErrors({}); const result = isEdit && initial ? await updateFaq({ ...form, id: initial.id }) : await createFaq(form); setSaving(false); if (!result.ok) { setErrors(result.error.fieldErrors ?? {}); setMessage(result.error.message); return; } router.push("/admin/faqs"); router.refresh(); }
  return <form onSubmit={submit} className="space-y-6">{message ? <p role="alert" className="rounded-control border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{message}</p> : null}
    <FormSection title="Question and answer" description="FAQ answers use Markdown. Raw HTML is stripped by the shared sanitizer in the preview and public renderer."><FormField label="Question" htmlFor="question" required error={errorFor(errors, "question")}><Input id="question" value={form.question} onChange={(event) => setField("question", event.target.value)} /></FormField><FormField label="Answer (Markdown)" htmlFor="answer" required error={errorFor(errors, "answer")}><Textarea id="answer" rows={8} value={form.answer} onChange={(event) => setField("answer", event.target.value)} /></FormField><div className="rounded-control border bg-surface-alt p-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Sanitized preview</p><MarkdownRenderer content={form.answer || "Your answer preview will appear here."} className="prose prose-sm max-w-none" /></div></FormSection>
    <FormSection title="Grouping and publication"><div className="grid gap-5 md:grid-cols-3"><FormField label="Service" htmlFor="serviceId" hint="Leave blank for a general FAQ." error={errorFor(errors, "serviceId")}><Select id="serviceId" value={form.serviceId ?? ""} onChange={(event) => setField("serviceId", event.target.value || null)}><option value="">General FAQ</option>{services.map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}</Select></FormField><FormField label="Status" htmlFor="status" required error={errorFor(errors, "status")}><Select id="status" value={form.status} onChange={(event) => setField("status", event.target.value as FaqFormState["status"])}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></Select></FormField><FormField label="Order" htmlFor="sortOrder" hint="Lower numbers appear first." error={errorFor(errors, "sortOrder")}><Input id="sortOrder" type="number" min={0} value={form.sortOrder} onChange={(event) => setField("sortOrder", Number(event.target.value))} /></FormField></div></FormSection>
    <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button><Button type="submit" loading={saving}>{isEdit ? "Save FAQ" : "Create FAQ"}</Button></div>
  </form>;
}
