"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { MarkdownRenderer } from "@/lib/markdown/renderer";
import type { PublishedFaq } from "@/server/queries/faqs";

type FaqGroup = { key: string; title: string; faqs: PublishedFaq[] };

export function FaqExplorer({ groups }: { groups: FaqGroup[] }) {
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");
  const normalized = query.trim().toLowerCase();
  const visibleGroups = useMemo(() => groups.map((group) => ({ ...group, faqs: group.faqs.filter((faq) => (!normalized || `${faq.question} ${faq.answer}`.toLowerCase().includes(normalized)) && (activeGroup === "all" || group.key === activeGroup)) })).filter((group) => group.faqs.length > 0), [activeGroup, groups, normalized]);
  return <div>
    <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start">
      <aside className="lg:sticky lg:top-28" aria-label="FAQ categories"><p className="eyebrow">Browse by topic</p><nav className="mt-4 flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-2 lg:overflow-visible">{[{ key: "all", title: "All questions" }, ...groups.map((group) => ({ key: group.key, title: group.title }))].map((item) => <button key={item.key} type="button" onClick={() => setActiveGroup(item.key)} aria-pressed={activeGroup === item.key} className={`shrink-0 rounded-pill border px-4 py-2 text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 lg:block lg:w-full ${activeGroup === item.key ? "border-dark bg-dark text-white" : "border-line bg-bg text-ink hover:bg-tint"}`}>{item.title}</button>)}</nav></aside>
      <div><label className="relative block"><span className="sr-only">Search frequently asked questions</span><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" size={18} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions" className="min-h-12 w-full rounded-pill border border-line bg-bg pl-11 pr-4 text-base text-ink shadow-soft focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2" /></label><div className="mt-8 space-y-8" aria-live="polite">{visibleGroups.length === 0 ? <div className="rounded-card border border-dashed p-8 text-center"><p className="font-semibold">No questions match your search</p><p className="mt-2 text-sm text-ink-muted">Try a broader term or choose all topics.</p></div> : visibleGroups.map((group) => <section key={group.key} aria-labelledby={`faq-${group.key}`}><h2 id={`faq-${group.key}`} className="font-heading text-h3 font-semibold">{group.title}</h2><div className="mt-4 divide-y divide-line rounded-card border border-line bg-bg shadow-soft">{group.faqs.map((faq, index) => <details key={faq.id} className="group p-5" open={index === 0 && !normalized}><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">{faq.question}<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tint text-accent transition-transform group-open:rotate-45" aria-hidden="true">+</span></summary><MarkdownRenderer content={faq.answer} className="prose prose-sm pt-3 leading-7 text-ink-muted prose-a:text-accent-ink" /></details>)}</div></section>)}</div></div>
    </div>
  </div>;
}
