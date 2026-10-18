"use client";

import { useState } from "react";
import { createGalleryYear, deleteGalleryYear, moveGalleryYearItems } from "@/app/(admin)/admin/(protected)/gallery/actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button, Input, Select } from "@/components/ui";
import type { GalleryYearView } from "@/server/services/gallery";

export function GalleryYearsManager({ years, onReload }: { years: GalleryYearView[]; onReload: () => Promise<void> }) {
  const [value, setValue] = useState(String(new Date().getFullYear()));
  const [rangeFrom, setRangeFrom] = useState(2003);
  const [rangeTo, setRangeTo] = useState(new Date().getFullYear());
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [moveTargets, setMoveTargets] = useState<Record<string, string>>({});

  async function addYear(year: number): Promise<boolean> {
    const result = await createGalleryYear({ year });
    if (!result.ok) { setMessage(result.error.message); return false; }
    return true;
  }
  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setBusy(true); const created = await addYear(Number(value)); setBusy(false);
    if (created) { setMessage(`Added ${value}.`); await onReload(); }
  }
  async function addRange(): Promise<void> {
    if (rangeFrom > rangeTo) { setMessage("The start year must be before the end year."); return; }
    setBusy(true); let added = 0;
    for (let current = rangeFrom; current <= rangeTo; current += 1) if (await addYear(current)) added += 1;
    setBusy(false); setMessage(`Added ${added} missing year${added === 1 ? "" : "s"}.`); await onReload();
  }
  async function remove(year: GalleryYearView): Promise<void> {
    setBusy(true); const result = await deleteGalleryYear({ id: year.id }); setBusy(false);
    setMessage(result.ok ? `Deleted ${year.year}.` : result.error.message); if (result.ok) await onReload();
  }
  async function moveAndDelete(year: GalleryYearView): Promise<void> {
    const target = years.find((candidate) => candidate.id === moveTargets[year.id]);
    if (!target) { setMessage("Add another year before moving these images."); return; }
    setBusy(true); const moved = await moveGalleryYearItems({ fromYearId: year.id, toYearId: target.id });
    if (!moved.ok) { setBusy(false); setMessage(moved.error.message); return; }
    const result = await deleteGalleryYear({ id: year.id }); setBusy(false);
    setMessage(result.ok ? `Moved ${moved.data.moved} item(s) to ${target.year} and deleted ${year.year}.` : result.error.message); if (result.ok) await onReload();
  }

  return <div className="space-y-5"><div className="grid gap-4 lg:grid-cols-2"><form onSubmit={(event) => void submit(event)} className="flex items-end gap-3 rounded-card border bg-surface p-4"><label className="flex-1 text-sm font-semibold">Add year<Input type="number" min={1990} max={new Date().getFullYear() + 1} value={value} onChange={(event) => setValue(event.target.value)} className="mt-1" required /></label><Button type="submit" loading={busy}>Add year</Button></form><section className="rounded-card border bg-surface p-4"><div className="flex items-end gap-3"><label className="flex-1 text-sm font-semibold">From<Input type="number" value={rangeFrom} onChange={(event) => setRangeFrom(Number(event.target.value))} className="mt-1" /></label><label className="flex-1 text-sm font-semibold">To<Input type="number" value={rangeTo} onChange={(event) => setRangeTo(Number(event.target.value))} className="mt-1" /></label><Button type="button" loading={busy} onClick={() => void addRange()}>Quick add range</Button></div></section></div>{message ? <p role="status" className="rounded-control border border-brand-deep/40 bg-brand/10 p-3 text-sm">{message}</p> : null}{years.length === 0 ? <div className="rounded-card border border-dashed p-8 text-center">No gallery years yet.</div> : <div className="space-y-3">{years.map((year) => <article key={year.id} className="flex flex-wrap items-center justify-between gap-3 rounded-card border bg-surface p-4"><div><h2 className="font-heading text-lg font-semibold">{year.year}</h2><p className="text-sm text-ink-muted">{year.imageCount} image/video item{year.imageCount === 1 ? "" : "s"}</p></div>{year.imageCount > 0 ? <div className="flex flex-wrap items-end gap-2"><label className="text-xs font-semibold">Move to<Select value={moveTargets[year.id] ?? ""} onChange={(event) => setMoveTargets((current) => ({ ...current, [year.id]: event.target.value }))} className="mt-1"><option value="">Choose year</option>{years.filter((candidate) => candidate.id !== year.id).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.year}</option>)}</Select></label><ConfirmDialog title={`Move ${year.imageCount} item(s) before deleting ${year.year}?`} description="All items will move to the selected year, then this year will be deleted." confirmLabel="Move and delete" onConfirm={() => moveAndDelete(year)}><Button type="button" variant="secondary" disabled={busy || !moveTargets[year.id]}>Move items and delete</Button></ConfirmDialog></div> : <ConfirmDialog title={`Delete ${year.year}?`} description="This year has no images." confirmLabel="Delete year" onConfirm={() => remove(year)}><Button type="button" variant="ghost" className="text-danger" disabled={busy}>Delete</Button></ConfirmDialog>}</article>)}</div>}</div>;
}
