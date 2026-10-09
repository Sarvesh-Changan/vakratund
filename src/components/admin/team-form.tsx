"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createTeamMember, updateTeamMember } from "@/app/(admin)/admin/(protected)/team/actions";
import { FormSection } from "@/components/admin/form-section";
import { MediaPicker, type MediaPickerAsset } from "@/components/admin/media-picker";
import { Button, Checkbox, FormField, Input, Textarea } from "@/components/ui";
import type { CreateTeamMemberInput } from "@/lib/validation/team";
import type { TeamMemberView } from "@/server/services/team";

type TeamFormState = CreateTeamMemberInput;
const blank: TeamFormState = { name: "", qualification: "", designation: "", experienceYrs: null, bio: "", photoId: null, sortOrder: 0, isVisible: true };
function initialState(initial: TeamMemberView | null): TeamFormState { return initial ? { name: initial.name, qualification: initial.qualification ?? "", designation: initial.designation, experienceYrs: initial.experienceYrs, bio: initial.bio ?? "", photoId: initial.photoId, sortOrder: initial.sortOrder, isVisible: initial.isVisible } : blank; }
function errorFor(errors: Record<string, string[]>, field: string): string | undefined { return errors[field]?.[0]; }

export function TeamForm({ initial, assets }: { initial: TeamMemberView | null; assets: readonly MediaPickerAsset[] }) {
  const router = useRouter(); const [form, setForm] = useState(() => initialState(initial)); const [errors, setErrors] = useState<Record<string, string[]>>({}); const [message, setMessage] = useState<string | null>(null); const [saving, setSaving] = useState(false); const isEdit = Boolean(initial);
  function setField<K extends keyof TeamFormState>(field: K, value: TeamFormState[K]) { setForm((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: [] })); }
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setMessage(null); setErrors({}); const result = isEdit && initial ? await updateTeamMember({ ...form, id: initial.id }) : await createTeamMember(form); setSaving(false); if (!result.ok) { setErrors(result.error.fieldErrors ?? {}); setMessage(result.error.message); return; } router.push("/admin/team"); router.refresh(); }
  return <form onSubmit={submit} className="space-y-6">{message ? <p role="alert" className="rounded-control border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{message}</p> : null}
    <FormSection title="Team member" description="Use approved professional details. Plain-text fields do not accept HTML."><div className="grid gap-5 md:grid-cols-2"><FormField label="Name" htmlFor="name" required error={errorFor(errors, "name")}><Input id="name" value={form.name} onChange={(event) => setField("name", event.target.value)} /></FormField><FormField label="Designation" htmlFor="designation" required error={errorFor(errors, "designation")}><Input id="designation" value={form.designation} onChange={(event) => setField("designation", event.target.value)} /></FormField><FormField label="Qualification" htmlFor="qualification" error={errorFor(errors, "qualification")}><Input id="qualification" value={form.qualification} onChange={(event) => setField("qualification", event.target.value)} /></FormField><FormField label="Experience (years)" htmlFor="experienceYrs" error={errorFor(errors, "experienceYrs")}><Input id="experienceYrs" type="number" min={0} max={100} value={form.experienceYrs ?? ""} onChange={(event) => setField("experienceYrs", event.target.value ? Number(event.target.value) : null)} /></FormField></div><FormField label="Bio" htmlFor="bio" hint="Optional short biography." error={errorFor(errors, "bio")}><Textarea id="bio" rows={5} value={form.bio} onChange={(event) => setField("bio", event.target.value)} /></FormField></FormSection>
    <FormSection title="Photo and visibility" description="Choose an image from the media library. Hidden members do not appear in public team queries."><MediaPicker assets={assets} value={form.photoId} onChange={(value) => setField("photoId", typeof value === "string" ? value : null)} label="Team photo" /><p className="text-sm text-danger">{errorFor(errors, "photoId")}</p><div className="grid gap-5 md:grid-cols-2"><FormField label="Order" htmlFor="sortOrder" hint="Lower numbers appear first." error={errorFor(errors, "sortOrder")}><Input id="sortOrder" type="number" min={0} value={form.sortOrder} onChange={(event) => setField("sortOrder", Number(event.target.value))} /></FormField><label className="flex items-center gap-3 self-end pb-7 text-sm font-semibold"><Checkbox checked={form.isVisible} onChange={(event) => setField("isVisible", event.target.checked)} /> Visible publicly</label></div></FormSection>
    <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button><Button type="submit" loading={saving}>{isEdit ? "Save team member" : "Create team member"}</Button></div>
  </form>;
}
