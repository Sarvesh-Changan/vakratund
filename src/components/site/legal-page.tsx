import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs, Container, EmptyState } from "@/components/ui";
import { extractHeadings } from "@/lib/markdown/toc";
import { MarkdownRenderer } from "@/lib/markdown/renderer";

type LegalPageProps = { title: string; eyebrow: string; content: string; breadcrumbs: Array<{ name: string; item: string }> };

export function LegalPage({ title, eyebrow, content, breadcrumbs }: LegalPageProps) {
  const headings = extractHeadings(content);

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <section className="section-dark pt-28 text-white sm:pt-32"><Container className="pb-14 lg:pb-16"><Breadcrumbs items={breadcrumbs.map((item) => ({ label: item.name, href: item.item }))} className="text-white/65" /><p className="eyebrow mt-10">{eyebrow}</p><h1 className="mt-3 max-w-3xl font-heading text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">Please review this information before using the website or sending an enquiry.</p></Container></section>
      <section className="section-light"><Container className="section-space"><div className="grid gap-12 lg:grid-cols-[12rem_minmax(0,68ch)] lg:items-start lg:gap-16">{headings.length > 0 ? <aside className="lg:sticky lg:top-28"><p className="eyebrow text-accent-ink">On this page</p><nav aria-label="On this page" className="mt-4 border-l border-line pl-4"><ul className="space-y-3 text-sm">{headings.map((heading) => <li key={heading.id} className={heading.level === 3 ? "pl-3" : undefined}><a href={`#${heading.id}`} className="text-ink-muted hover:text-accent-ink">{heading.text}</a></li>)}</ul></nav></aside> : <div aria-hidden="true" />}{content ? <article className="max-w-none"><MarkdownRenderer content={content} headingIds={headings.map((heading) => heading.id)} className="prose prose-slate max-w-none leading-8 text-ink-muted prose-headings:font-heading prose-headings:text-ink prose-a:text-accent-ink" /></article> : <EmptyState title="This policy is being prepared" description="The policy content will be published here soon." />}</div></Container></section>
    </>
  );
}
