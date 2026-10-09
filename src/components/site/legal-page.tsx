import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs, Container, EmptyState } from "@/components/ui";
import { MarkdownRenderer } from "@/lib/markdown/renderer";

type LegalPageProps = { title: string; eyebrow: string; content: string; breadcrumbs: Array<{ name: string; item: string }> };

export function LegalPage({ title, eyebrow, content, breadcrumbs }: LegalPageProps) {
  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <section className="bg-charcoal pt-32 text-white sm:pt-36"><Container className="pb-16 lg:pb-20"><Breadcrumbs items={breadcrumbs.map((item) => ({ label: item.name, href: item.item }))} className="text-white/65" /><p className="mt-10 text-sm font-semibold uppercase tracking-[0.14em] text-brand">{eyebrow}</p><h1 className="mt-3 max-w-3xl font-heading text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">Please review this information before using the website or sending an enquiry.</p></Container></section>
      <Container className="py-16 lg:py-24"><article className="mx-auto max-w-[68ch]">{content ? <MarkdownRenderer content={content} className="prose prose-slate max-w-none leading-8 text-ink-muted prose-headings:font-heading prose-headings:text-ink prose-a:text-brand-deep" /> : <EmptyState title="This policy is being prepared" description="The policy content will be published here soon." />}</article></Container>
    </>
  );
}
