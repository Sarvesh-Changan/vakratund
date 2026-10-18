"use client";

import { useState } from "react";
import { savePageSectionAction } from "@/app/(admin)/admin/(protected)/pages/actions";
import { MediaPicker, type MediaPickerAsset } from "@/components/admin/media-picker";

type Section = { pageKey: string; sectionKey: string; content: unknown; isVisible: boolean };

const sections = [
  { pageKey: "home", sectionKey: "hero" },
  { pageKey: "home", sectionKey: "stats" },
  { pageKey: "home", sectionKey: "services" },
  { pageKey: "home", sectionKey: "projects" },
  { pageKey: "home", sectionKey: "why" },
  { pageKey: "home", sectionKey: "process" },
  { pageKey: "home", sectionKey: "specialty" },
  { pageKey: "home", sectionKey: "faq" },
  { pageKey: "home", sectionKey: "estimator" },
  { pageKey: "home", sectionKey: "cta" },
  { pageKey: "about", sectionKey: "story" },
  { pageKey: "about", sectionKey: "mission" },
  { pageKey: "about", sectionKey: "journey" },
] as const;

const defaults: Record<string, Record<string, unknown>> = {
  "home:hero": { eyebrow: "", title: "", description: "", trustChips: ["MSME registered", "Insured workforce", "Since 2003"], primaryCta: "Get Free Quote", primaryHref: "/estimate", secondaryCta: "Call Now", secondaryHref: "", backgroundImageId: null },
  "home:stats": { items: [] },
  "home:services": { eyebrow: "Services", title: "Our services", description: "", viewAllLabel: "View all services", serviceLinkLabel: "Explore service" },
  "home:projects": { eyebrow: "Featured work", title: "Selected projects", description: "", viewAllLabel: "View all projects" },
  "home:why": { eyebrow: "Leadership", title: "Why Vakratund", description: "", quote: "" },
  "home:process": { eyebrow: "How we work", title: "Our process", steps: [{ title: "Survey", description: "" }] },
  "home:specialty": { eyebrow: "Structural repairs", title: "Structural audit and repair for societies", description: "", ctaLabel: "Request Site Inspection", ctaHref: "/contact?type=inspection" },
  "home:faq": { eyebrow: "FAQs", title: "Common questions", viewAllLabel: "View all FAQs" },
  "home:estimator": { eyebrow: "Project planning", title: "Explore an indicative estimate", description: "Use the estimator to share project requirements. Final quotation follows site inspection.", ctaLabel: "Estimate a project" },
  "home:cta": { title: "", description: "", primaryCta: "Get Free Quote", primaryHref: "/estimate", secondaryCta: "", secondaryHref: "", callCta: "Call Now", whatsappCta: "Chat on WhatsApp" },
  "about:story": { title: "Our story", body: "" },
  "about:mission": { title: "Our mission", body: "" },
  "about:journey": { eyebrow: "Since 2003", title: "Our journey", milestones: [] },
};

function TextField({ label, value, onChange, area = false, hint }: { label: string; value: string; onChange: (value: string) => void; area?: boolean; hint?: string }) {
  return <label className="block space-y-1 text-sm font-medium">{label}{area ? <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="w-full rounded-control border p-2" /> : <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-control border p-2" />}{hint ? <span className="block text-xs font-normal text-ink-muted">{hint}</span> : null}</label>;
}

export function PagesContentEditor({ initial, assets = [], phoneHref = "/contact" }: { initial: Section[]; assets?: MediaPickerAsset[]; phoneHref?: string }) {
  const [rows, setRows] = useState(() => sections.map((section) => {
    const found = initial.find((row) => row.pageKey === section.pageKey && row.sectionKey === section.sectionKey);
    const base = defaults[`${section.pageKey}:${section.sectionKey}`];
    const content = { ...base, ...(found?.content as Record<string, unknown> | undefined) };
    if (section.sectionKey === "hero" && !found?.content) content.secondaryHref = phoneHref;
    if (section.sectionKey === "hero" && found?.content && !(typeof (found.content as Record<string, unknown>).secondaryHref === "string" && String((found.content as Record<string, unknown>).secondaryHref).trim())) content.secondaryHref = phoneHref;
    return { ...section, isVisible: found?.isVisible ?? true, content };
  }));
  const [message, setMessage] = useState("");

  function update(index: number, patch: Record<string, unknown>) {
    setRows((all) => all.map((row, rowIndex) => rowIndex === index ? { ...row, content: { ...(row.content as Record<string, unknown>), ...patch } } : row));
  }

  async function save(index: number) {
    const result = await savePageSectionAction(rows[index]);
    setMessage(result.ok ? "Saved." : "Please correct the section fields.");
  }

  return <div className="space-y-6">
    {message ? <p role="status" className="text-sm">{message}</p> : null}
    {rows.map((row, index) => {
      const content = row.content as Record<string, unknown>;
      const items = Array.isArray(content.items) ? content.items as { label: string; value: string }[] : [];
      const steps = Array.isArray(content.steps) ? content.steps as { title: string; description: string }[] : [];
      const trustChips = Array.isArray(content.trustChips) ? content.trustChips as string[] : [];
      const milestones = Array.isArray(content.milestones) ? content.milestones as { year: number; title: string; description: string }[] : [];
      return <section key={`${row.pageKey}:${row.sectionKey}`} className="space-y-4 rounded-panel border bg-white p-5">
        <div className="flex items-center justify-between"><h2 className="font-display text-xl capitalize">{row.pageKey} / {row.sectionKey}</h2><label className="flex gap-2 text-sm"><input type="checkbox" checked={row.isVisible} onChange={(event) => setRows((all) => all.map((item, itemIndex) => itemIndex === index ? { ...item, isVisible: event.target.checked } : item))} /> Visible</label></div>
        {row.sectionKey === "hero" ? <>
          <MediaPicker assets={assets} value={String(content.backgroundImageId ?? "") || null} onChange={(value) => update(index, { backgroundImageId: typeof value === "string" ? value : null })} label="Hero background image" />
          <TextField label="Eyebrow" value={String(content.eyebrow ?? "")} onChange={(value) => update(index, { eyebrow: value })} />
          <TextField label="Headline" value={String(content.title ?? "")} onChange={(value) => update(index, { title: value })} />
          <TextField label="Sub-line" value={String(content.description ?? "")} onChange={(value) => update(index, { description: value })} area />
          <TextField label="Trust chips (one per line, up to 3)" value={trustChips.join("\n")} onChange={(value) => update(index, { trustChips: value.split("\n").map((item) => item.trim()).filter(Boolean).slice(0, 3) })} area hint="Use approved credentials and facts only." />
          <div className="grid gap-3 sm:grid-cols-2"><TextField label="Primary CTA" value={String(content.primaryCta ?? "")} onChange={(value) => update(index, { primaryCta: value })} /><TextField label="Primary URL" value={String(content.primaryHref ?? "/estimate")} onChange={(value) => update(index, { primaryHref: value })} /><TextField label="Secondary CTA" value={String(content.secondaryCta ?? "")} onChange={(value) => update(index, { secondaryCta: value })} /><TextField label="Secondary URL" value={String(content.secondaryHref ?? "")} onChange={(value) => update(index, { secondaryHref: value })} /></div>
        </> : null}
        {row.sectionKey === "stats" ? <TextField label="Proof statistics (label:value per line)" value={items.map((item) => `${item.label}:${item.value}`).join("\n")} onChange={(value) => update(index, { items: value.split("\n").filter(Boolean).slice(0, 5).map((line) => { const parts = line.split(":"); return { label: (parts.shift() ?? "").trim(), value: parts.join(":").trim() }; }) })} area hint="Leave blank to hide the row. Enter only verified numeric facts; use a separate label for each project-specific figure. Up to 5 cards. TODO(client): confirm additional KPIs before adding them." /> : null}
        {["services", "projects"].includes(row.sectionKey) ? <div className="grid gap-3 sm:grid-cols-2"><TextField label="Eyebrow" value={String(content.eyebrow ?? "")} onChange={(value) => update(index, { eyebrow: value })} /><TextField label="Section title" value={String(content.title ?? "")} onChange={(value) => update(index, { title: value })} /><TextField label="Description" value={String(content.description ?? "")} onChange={(value) => update(index, { description: value })} area /><TextField label="View all link label" value={String(content.viewAllLabel ?? "")} onChange={(value) => update(index, { viewAllLabel: value })} />{row.sectionKey === "services" ? <TextField label="Service card link label" value={String(content.serviceLinkLabel ?? "")} onChange={(value) => update(index, { serviceLinkLabel: value })} /> : null}</div> : null}
        {row.sectionKey === "why" ? <div className="grid gap-3"><TextField label="Eyebrow" value={String(content.eyebrow ?? "")} onChange={(value) => update(index, { eyebrow: value })} /><TextField label="Section title" value={String(content.title ?? "")} onChange={(value) => update(index, { title: value })} /><TextField label="Supporting copy" value={String(content.description ?? "")} onChange={(value) => update(index, { description: value })} area /><TextField label="Approved proprietor quote (optional)" value={String(content.quote ?? "")} onChange={(value) => update(index, { quote: value })} area hint="Leave empty until the proprietor approves an exact quote. Do not draft one here." /></div> : null}
        {row.sectionKey === "process" ? <div className="grid gap-3"><TextField label="Eyebrow" value={String(content.eyebrow ?? "")} onChange={(value) => update(index, { eyebrow: value })} /><TextField label="Title" value={String(content.title ?? "")} onChange={(value) => update(index, { title: value })} /><TextField label="Steps (title:description per line)" value={steps.map((step) => `${step.title}:${step.description}`).join("\n")} onChange={(value) => update(index, { steps: value.split("\n").filter(Boolean).map((line) => { const parts = line.split(":"); return { title: (parts.shift() ?? "").trim(), description: parts.join(":").trim() }; }) })} area /></div> : null}
        {row.sectionKey === "specialty" ? <div className="grid gap-3 sm:grid-cols-2"><TextField label="Eyebrow" value={String(content.eyebrow ?? "")} onChange={(value) => update(index, { eyebrow: value })} /><TextField label="Title" value={String(content.title ?? "")} onChange={(value) => update(index, { title: value })} /><TextField label="Description" value={String(content.description ?? "")} onChange={(value) => update(index, { description: value })} area /><TextField label="CTA label" value={String(content.ctaLabel ?? "")} onChange={(value) => update(index, { ctaLabel: value })} /><TextField label="CTA URL" value={String(content.ctaHref ?? "/contact?type=inspection")} onChange={(value) => update(index, { ctaHref: value })} /></div> : null}
        {row.sectionKey === "faq" ? <div className="grid gap-3 sm:grid-cols-2"><TextField label="Eyebrow" value={String(content.eyebrow ?? "")} onChange={(value) => update(index, { eyebrow: value })} /><TextField label="Section title" value={String(content.title ?? "")} onChange={(value) => update(index, { title: value })} /><TextField label="View all link label" value={String(content.viewAllLabel ?? "")} onChange={(value) => update(index, { viewAllLabel: value })} /></div> : null}
        {row.sectionKey === "estimator" ? <div className="grid gap-3 sm:grid-cols-2"><TextField label="Eyebrow" value={String(content.eyebrow ?? "")} onChange={(value) => update(index, { eyebrow: value })} /><TextField label="Title" value={String(content.title ?? "")} onChange={(value) => update(index, { title: value })} /><TextField label="Description" value={String(content.description ?? "")} onChange={(value) => update(index, { description: value })} area /><TextField label="CTA label" value={String(content.ctaLabel ?? "")} onChange={(value) => update(index, { ctaLabel: value })} /></div> : null}
        {row.pageKey === "about" && ["story", "mission"].includes(row.sectionKey) ? <div className="grid gap-3"><TextField label="Title" value={String(content.title ?? "")} onChange={(value) => update(index, { title: value })} /><TextField label="Body" value={String(content.body ?? "")} onChange={(value) => update(index, { body: value })} area /></div> : null}
        {row.pageKey === "about" && row.sectionKey === "journey" ? <div className="grid gap-3"><TextField label="Eyebrow" value={String(content.eyebrow ?? "")} onChange={(value) => update(index, { eyebrow: value })} /><TextField label="Title" value={String(content.title ?? "")} onChange={(value) => update(index, { title: value })} /><TextField label="Milestones (year:title:description per line)" value={milestones.map((milestone) => `${milestone.year}:${milestone.title}:${milestone.description ?? ""}`).join("\n")} onChange={(value) => update(index, { milestones: value.split("\n").filter(Boolean).map((line) => { const parts = line.split(":"); return { year: Number((parts.shift() ?? "").trim()), title: (parts.shift() ?? "").trim(), description: parts.join(":").trim() }; }) })} area hint="Leave blank when there are no approved milestones. Do not add unverified dates or claims." /></div> : null}
        {row.sectionKey === "cta" ? <div className="grid gap-3 sm:grid-cols-2"><TextField label="Title" value={String(content.title ?? "")} onChange={(value) => update(index, { title: value })} /><TextField label="Description" value={String(content.description ?? "")} onChange={(value) => update(index, { description: value })} area /><TextField label="Get quote CTA" value={String(content.primaryCta ?? "")} onChange={(value) => update(index, { primaryCta: value })} /><TextField label="Quote URL" value={String(content.primaryHref ?? "/estimate")} onChange={(value) => update(index, { primaryHref: value })} /><TextField label="Call CTA" value={String(content.callCta ?? "Call Now")} onChange={(value) => update(index, { callCta: value })} /><TextField label="WhatsApp CTA" value={String(content.whatsappCta ?? "Chat on WhatsApp")} onChange={(value) => update(index, { whatsappCta: value })} /></div> : null}
        <button type="button" onClick={() => void save(index)} className="rounded-control bg-brand px-4 py-2 font-semibold">Save section</button>
      </section>;
    })}
  </div>;
}
