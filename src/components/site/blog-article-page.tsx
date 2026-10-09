import { ArrowLeft, ExternalLink, Mail, MessageCircle, Share2 } from "lucide-react";
import Link from "next/link";

import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { BlogCard } from "@/components/site/blog-card";
import { CloudImage } from "@/components/cloud-image";
import { Badge, Breadcrumbs, Container, SectionHeading } from "@/components/ui";
import { MarkdownRenderer } from "@/lib/markdown/renderer";
import { extractBlogHeadings } from "@/lib/blog/toc";
import { absoluteUrl } from "@/lib/seo/metadata";
import type { ResolvedSiteSettings } from "@/config/site";
import type { PublishedBlogPost } from "@/server/queries/blog";
import { buildWhatsAppShareHref } from "@/lib/contact/whatsapp";

const breadcrumbsFor = (post: PublishedBlogPost) => [{ name: "Home", item: "/" }, { name: "Blog", item: "/blog" }, { name: post.title, item: `/blog/${post.slug}` }] as const;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date(value));
}

function shareLinks(post: PublishedBlogPost) {
  const url = absoluteUrl(`/blog/${post.slug}`);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(post.title);
  return [{ label: "WhatsApp", href: buildWhatsAppShareHref(`${post.title} ${url}`), icon: MessageCircle }, { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, icon: ExternalLink }, { label: "Email", href: `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(`${post.title}\n\n${url}`)}`, icon: Mail }];
}

export function BlogArticlePage({ post, relatedPosts, settings }: { post: PublishedBlogPost; relatedPosts: PublishedBlogPost[]; settings: ResolvedSiteSettings }) {
  const breadcrumbs = breadcrumbsFor(post);
  const headings = extractBlogHeadings(post.content);
  const authorName = post.author?.name ?? settings.businessName;
  return <><ArticleJsonLd article={{ headline: post.title, description: post.excerpt, slug: post.slug, datePublished: post.publishedAt, authorName, publisherName: settings.businessName, image: post.cover?.url }} /><BreadcrumbJsonLd items={breadcrumbs} /><article><header className="bg-charcoal pt-28 text-white sm:pt-32"><Container className="pb-14 lg:pb-20"><Breadcrumbs items={breadcrumbs.map((item) => ({ label: item.name, href: item.item }))} className="text-white/65" /><div className="mt-10 max-w-4xl"><div className="flex flex-wrap items-center gap-3">{post.category ? <Badge variant="brand">{post.category.name}</Badge> : null}<span className="text-sm text-white/65">{formatDate(post.publishedAt)}</span><span className="text-sm text-white/65">{post.readingMins} min read</span></div><h1 className="mt-5 font-heading text-4xl font-bold tracking-tight sm:text-5xl">{post.title}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-white/75">{post.excerpt}</p><p className="mt-6 text-sm text-white/65">By {authorName}</p></div>{post.cover ? <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-panel bg-white/10"><CloudImage src={post.cover.url} alt={post.cover.alt} fill sizes="(min-width: 1024px) 80vw, 100vw" priority className="object-cover" /></div> : null}</Container></header><Container className="py-14 lg:py-24"><div className="grid gap-12 lg:grid-cols-[minmax(0,68ch)_16rem] lg:items-start lg:justify-between lg:gap-16"><div className="min-w-0"><Link href="/blog" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-deep hover:underline"><ArrowLeft size={16} aria-hidden="true" /> Back to insights</Link><MarkdownRenderer content={post.content} headingIds={headings.map((heading) => heading.id)} className="prose prose-slate mt-8 max-w-[68ch] leading-8 text-ink-muted prose-headings:font-heading prose-headings:text-ink prose-a:text-brand-deep prose-img:rounded-card" /></div><aside className="space-y-6 lg:sticky lg:top-28"><div><p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-deep">Contents</p>{headings.length > 0 ? <nav aria-label="Table of contents" className="mt-4 border-l border-line pl-4"><ol className="space-y-3">{headings.map((heading) => <li key={heading.id} className={heading.level === 3 ? "pl-3" : undefined}><a href={`#${heading.id}`} className="text-sm leading-6 text-ink-muted hover:text-brand-deep hover:underline">{heading.text}</a></li>)}</ol></nav> : <p className="mt-3 text-sm text-ink-muted">This article has no section headings.</p>}</div><div><p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-deep">Share</p><div className="mt-3 flex flex-wrap gap-2">{shareLinks(post).map((link) => { const Icon = link.icon; return <a key={link.label} href={link.href} target={link.href.startsWith("mailto:") ? undefined : "_blank"} rel={link.href.startsWith("mailto:") ? undefined : "noopener noreferrer"} aria-label={`Share on ${link.label}`} className="inline-flex size-11 items-center justify-center rounded-full border border-line text-ink-muted hover:border-brand-deep hover:text-brand-deep"><Icon size={18} aria-hidden="true" /></a>; })}</div><p className="mt-2 text-xs text-ink-muted"><Share2 size={13} className="mr-1 inline" aria-hidden="true" />Share this article</p></div></aside></div>{relatedPosts.length > 0 ? <section className="mt-20 border-t border-line pt-16" aria-labelledby="related-posts-heading"><SectionHeading eyebrow="Keep reading" title="Related articles" /><div id="related-posts-heading" className="mt-8 grid gap-6 md:grid-cols-3">{relatedPosts.map((related) => <BlogCard key={related.id} post={related} />)}</div></section> : null}</Container></article></>;
}
