"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createBlogPost, updateBlogPost } from "@/app/(admin)/admin/(protected)/blog/actions";
import { BlogMarkdownEditor } from "@/components/admin/blog-markdown-editor";
import { FormSection } from "@/components/admin/form-section";
import { SaveBar } from "@/components/admin/save-bar";
import type { MediaPickerAsset } from "@/components/admin/media-picker";
import { MediaPicker } from "@/components/admin/media-picker";
import { Button, FormField, Input, Select, Textarea } from "@/components/ui";
import type { CreateBlogPostInput } from "@/lib/validation/blog";
import type { BlogCategoryView, BlogAuthorView, BlogPostView } from "@/server/services/blog";

type FormState = CreateBlogPostInput;
type DraftSnapshot = Omit<FormState, "publishedAt"> & { publishedAt: string | null; savedAt: number };
const blank: FormState = { title: "", slug: "", excerpt: "", content: "", coverId: null, categoryId: null, authorId: null, status: "DRAFT", publishedAt: null, seoTitle: "", seoDesc: "" };

function initialState(initial: BlogPostView | null): FormState {
  if (!initial) return blank;
  return { title: initial.title, slug: initial.slug, excerpt: initial.excerpt, content: initial.content, coverId: initial.coverId, categoryId: initial.categoryId, authorId: initial.authorId, status: initial.status, publishedAt: initial.publishedAt ? new Date(initial.publishedAt) : null, seoTitle: initial.seoTitle ?? "", seoDesc: initial.seoDesc ?? "" };
}

function errorFor(errors: Record<string, string[]>, field: string): string | undefined { return errors[field]?.[0]; }
function datetimeLocal(value: Date | null): string { if (!value) return ""; const offset = value.getTimezoneOffset(); return new Date(value.getTime() - offset * 60_000).toISOString().slice(0, 16); }
function isDraftSnapshot(value: unknown): value is DraftSnapshot { if (!value || typeof value !== "object") return false; const draft = value as Partial<DraftSnapshot>; return typeof draft.title === "string" && typeof draft.excerpt === "string" && typeof draft.content === "string" && typeof draft.savedAt === "number"; }

export function BlogPostForm({ initial, categories, authors, assets }: { initial: BlogPostView | null; categories: readonly BlogCategoryView[]; authors: readonly BlogAuthorView[]; assets: readonly MediaPickerAsset[] }) {
  const router = useRouter(); const formRef = useRef<HTMLFormElement>(null); const draftKey = `blog-post-draft:${initial?.id ?? "new"}`;
  const [form, setForm] = useState(() => initialState(initial)); const [errors, setErrors] = useState<Record<string, string[]>>({}); const [message, setMessage] = useState<string | null>(null); const [saving, setSaving] = useState(false); const [dirty, setDirty] = useState(false); const [draftReady, setDraftReady] = useState(false); const [restoreDraft, setRestoreDraft] = useState<DraftSnapshot | null>(null); const isEdit = Boolean(initial);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { const raw = window.localStorage.getItem(draftKey); if (!raw) { setDraftReady(true); return; } const parsed: unknown = JSON.parse(raw); if (isDraftSnapshot(parsed) && (parsed.title || parsed.content || parsed.excerpt)) setRestoreDraft(parsed); else window.localStorage.removeItem(draftKey); } catch { window.localStorage.removeItem(draftKey); } finally { setDraftReady(true); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [draftKey]);

  useEffect(() => {
    if (!draftReady) return;
    const snapshot: DraftSnapshot = { ...form, publishedAt: form.publishedAt?.toISOString() ?? null, savedAt: Date.now() };
    window.localStorage.setItem(draftKey, JSON.stringify(snapshot));
  }, [draftKey, draftReady, form]);

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) { setForm((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: [] })); setDirty(true); }
  function restore() { if (!restoreDraft) return; setForm({ ...restoreDraft, publishedAt: restoreDraft.publishedAt ? new Date(restoreDraft.publishedAt) : null }); setRestoreDraft(null); setDirty(true); }
  function discardDraft() { window.localStorage.removeItem(draftKey); setRestoreDraft(null); }
  function discardChanges() { window.localStorage.removeItem(draftKey); setForm(initialState(initial)); setErrors({}); setMessage(null); setDirty(false); }
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setMessage(null); setErrors({}); const result = isEdit && initial ? await updateBlogPost({ ...form, id: initial.id }) : await createBlogPost(form); setSaving(false); if (!result.ok) { setErrors(result.error.fieldErrors ?? {}); setMessage(result.error.message); return; } window.localStorage.removeItem(draftKey); setDirty(false); router.push("/admin/blog"); router.refresh(); }

  return <><form ref={formRef} onSubmit={submit} className="space-y-6">{message ? <p role="alert" className="rounded-control border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{message}</p> : null}{restoreDraft ? <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-brand-deep/40 bg-brand/10 p-3 text-sm"><span>A local draft from {new Date(restoreDraft.savedAt).toLocaleString("en-IN")} is available.</span><span className="flex gap-2"><Button type="button" size="sm" onClick={restore}>Restore draft</Button><Button type="button" size="sm" variant="ghost" onClick={discardDraft}>Discard draft</Button></span></div> : null}
    <FormSection title="Post identity" description="The title, excerpt, and slug define the article’s public identity."><div className="grid gap-5 md:grid-cols-2"><FormField label="Title" htmlFor="title" required error={errorFor(errors, "title")}><Input id="title" value={form.title} onChange={(event) => setField("title", event.target.value)} /></FormField><FormField label="Slug" htmlFor="slug" hint="Leave blank to generate it from the title." error={errorFor(errors, "slug")}><Input id="slug" value={form.slug} onChange={(event) => setField("slug", event.target.value)} /></FormField></div><FormField label="Excerpt" htmlFor="excerpt" required hint={`${form.excerpt.length}/500 characters`} error={errorFor(errors, "excerpt")}><Textarea id="excerpt" rows={3} maxLength={500} value={form.excerpt} onChange={(event) => setField("excerpt", event.target.value)} /></FormField></FormSection>
    <FormSection title="Article content" description="Write Markdown. Raw HTML is removed by the shared sanitizer in preview and public rendering."><FormField label="Markdown content" htmlFor="content" required error={errorFor(errors, "content")}><BlogMarkdownEditor value={form.content} onChange={(value) => setField("content", value)} /></FormField><p className="text-sm text-ink-muted">Automatic reading time: {Math.max(1, Math.ceil(form.content.trim().split(/\s+/).filter(Boolean).length / 200))} min</p></FormSection>
    <FormSection title="Presentation" description="Use approved media and taxonomy so posts remain easy to browse."><MediaPicker assets={assets} value={form.coverId} onChange={(value) => setField("coverId", typeof value === "string" ? value : null)} label="Cover image" /><div className="grid gap-5 md:grid-cols-2"><FormField label="Category" htmlFor="categoryId" error={errorFor(errors, "categoryId")}><Select id="categoryId" value={form.categoryId ?? ""} onChange={(event) => setField("categoryId", event.target.value || null)}><option value="">No category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></FormField><FormField label="Author" htmlFor="authorId" error={errorFor(errors, "authorId")}><Select id="authorId" value={form.authorId ?? ""} onChange={(event) => setField("authorId", event.target.value || null)}><option value="">No author</option>{authors.map((author) => <option key={author.id} value={author.id}>{author.name} ({author.email})</option>)}</Select></FormField></div></FormSection>
    <FormSection title="Publication and scheduling" description="A future publication date remains hidden from public queries until it is due. Leaving the date blank publishes immediately when status is set to Published."><div className="grid gap-5 md:grid-cols-3"><FormField label="Status" htmlFor="status" required error={errorFor(errors, "status")}><Select id="status" value={form.status} onChange={(event) => setField("status", event.target.value as FormState["status"])}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></Select></FormField><FormField label="Publish at" htmlFor="publishedAt" hint="Use a future date to schedule publication." error={errorFor(errors, "publishedAt")}><Input id="publishedAt" type="datetime-local" value={datetimeLocal(form.publishedAt)} onChange={(event) => setField("publishedAt", event.target.value ? new Date(event.target.value) : null)} /></FormField><div className="rounded-control border bg-surface-alt p-3 text-sm"><p className="font-semibold">Reading time</p><p className="mt-1 text-ink-muted">Calculated automatically from word count.</p></div></div></FormSection>
    <FormSection title="Search appearance" description="Search engines may truncate longer values."><div className="grid gap-5 md:grid-cols-2"><FormField label="SEO title" htmlFor="seoTitle" hint={`${form.seoTitle?.length ?? 0}/60 characters`} error={errorFor(errors, "seoTitle")}><Input id="seoTitle" maxLength={60} value={form.seoTitle ?? ""} onChange={(event) => setField("seoTitle", event.target.value)} /></FormField><FormField label="SEO description" htmlFor="seoDesc" hint={`${form.seoDesc?.length ?? 0}/160 characters`} error={errorFor(errors, "seoDesc")}><Textarea id="seoDesc" maxLength={160} rows={3} value={form.seoDesc ?? ""} onChange={(event) => setField("seoDesc", event.target.value)} /></FormField></div><div className="rounded-control border bg-surface-alt p-4"><p className="text-xs text-ink-muted">Search preview</p><p className="mt-2 truncate text-lg text-blue-700">{form.seoTitle || form.title || "Post title"}</p><p className="truncate text-sm text-success">https://vakratund.example/blog/{form.slug || "post-slug"}</p><p className="mt-1 text-sm text-ink-muted">{form.seoDesc || form.excerpt || "Your article excerpt will appear here."}</p></div></FormSection>
    <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button><Button type="submit" loading={saving}>{isEdit ? "Save post" : "Create post"}</Button></div>
  </form><SaveBar dirty={dirty} saving={saving} onSave={() => formRef.current?.requestSubmit()} onDiscard={discardChanges} /></>;
}
