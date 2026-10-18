import { ArrowLeft, ExternalLink, Mail, Share2 } from "lucide-react";
import Link from "next/link";

import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { BlogCard } from "@/components/site/blog-card";
import { CloudImage } from "@/components/cloud-image";
import { MaskImage, Reveal, RevealGroup } from "@/components/motion";
import { Badge, Breadcrumbs, Container, SectionHeading } from "@/components/ui";
import { MarkdownRenderer } from "@/lib/markdown/renderer";
import { extractBlogHeadings } from "@/lib/blog/toc";
import { absoluteUrl } from "@/lib/seo/metadata";
import type { ResolvedSiteSettings } from "@/config/site";
import type { PublishedBlogPost } from "@/server/queries/blog";
import { buildWhatsAppShareHref } from "@/lib/contact/whatsapp";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { ReadingProgress } from "./reading-progress";

const breadcrumbsFor = (post: PublishedBlogPost) =>
  [
    { name: "Home", item: "/" },
    { name: "Blog", item: "/blog" },
    { name: post.title, item: `/blog/${post.slug}` },
  ] as const;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(
    new Date(value),
  );
}

function shareLinks(post: PublishedBlogPost) {
  const url = absoluteUrl(`/blog/${post.slug}`);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(post.title);
  return [
    {
      label: "WhatsApp",
      href: buildWhatsAppShareHref(`${post.title} ${url}`),
      isWhatsApp: true as const,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: ExternalLink,
    },
    {
      label: "Email",
      href: `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(`${post.title}\n\n${url}`)}`,
      icon: Mail,
    },
  ];
}

export function BlogArticlePage({
  post,
  relatedPosts,
  settings,
}: {
  post: PublishedBlogPost;
  relatedPosts: PublishedBlogPost[];
  settings: ResolvedSiteSettings;
}) {
  const breadcrumbs = breadcrumbsFor(post);
  const headings = extractBlogHeadings(post.content);
  const authorName = post.author?.name ?? settings.businessName;
  return (
    <>
      <ReadingProgress />
      <ArticleJsonLd
        article={{
          headline: post.title,
          description: post.excerpt,
          slug: post.slug,
          datePublished: post.publishedAt,
          authorName,
          publisherName: settings.businessName,
          image: post.cover?.url,
        }}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <article>
        <header className="section-dark pt-28 text-white sm:pt-32">
          <Container className="section-space-compact">
            <Reveal>
              <Breadcrumbs
                items={breadcrumbs.map((item) => ({
                  label: item.name,
                  href: item.item,
                }))}
                className="text-white/65"
              />
              <div className="mt-10 max-w-5xl">
                <p className="eyebrow text-brand">
                  {post.category?.name ?? "Insights"}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {post.category ? (
                    <Badge variant="brand">{post.category.name}</Badge>
                  ) : null}
                  <span className="text-sm text-white/65">
                    {formatDate(post.publishedAt)}
                  </span>
                  <span className="text-sm text-white/65">
                    {post.readingMins} min read
                  </span>
                </div>
                <h1 className="mt-5 font-heading text-h1 font-semibold leading-[1.04] tracking-[-0.045em]">
                  {post.title}
                </h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-white/75">
                  {post.excerpt}
                </p>
                <p className="mt-6 text-sm text-white/65">By {authorName}</p>
              </div>
              {post.cover ? (
                <MaskImage className="mt-10 rounded-panel">
                  <div className="relative aspect-[16/9] overflow-hidden rounded-panel bg-white/10">
                    <CloudImage
                      src={post.cover.url}
                      alt={post.cover.alt}
                      fill
                      sizes="(min-width: 1024px) 80vw, 100vw"
                      priority
                      className="object-cover"
                    />
                  </div>
                </MaskImage>
              ) : null}
            </Reveal>
          </Container>
        </header>
        <Container className="section-light section-space">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,68ch)_16rem] lg:items-start lg:justify-between lg:gap-16">
            <div className="min-w-0">
              <Link
                href="/blog"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-deep hover:underline"
              >
                <ArrowLeft size={16} aria-hidden="true" /> Back to insights
              </Link>
              <MarkdownRenderer
                content={post.content}
                headingIds={headings.map((heading) => heading.id)}
                className="prose prose-slate mt-8 max-w-[68ch] leading-8 text-ink-muted prose-headings:font-heading prose-headings:text-ink prose-a:text-brand-deep prose-img:rounded-card"
              />
            </div>
            <aside className="space-y-6 lg:sticky lg:top-28">
              <div className="rounded-card border border-line bg-tint p-5"><p className="eyebrow">Written by</p><div className="mt-4 flex items-center gap-3"><span className="flex size-12 items-center justify-center rounded-full bg-cta-gradient font-heading font-bold text-dark" aria-hidden="true">{authorName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</span><div><p className="font-semibold text-ink">{authorName}</p><p className="text-sm text-ink-muted">Vakratund Construction</p></div></div></div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-deep">
                  Contents
                </p>
                {headings.length > 0 ? (
                  <Reveal>
                    <nav
                      aria-label="Table of contents"
                      className="mt-4 border-l border-line pl-4"
                    >
                      <ol className="space-y-3">
                        {headings.map((heading) => (
                          <li
                            key={heading.id}
                            className={heading.level === 3 ? "pl-3" : undefined}
                          >
                            <a
                              href={`#${heading.id}`}
                              className="text-sm leading-6 text-ink-muted hover:text-brand-deep hover:underline"
                            >
                              {heading.text}
                            </a>
                          </li>
                        ))}
                      </ol>
                    </nav>
                  </Reveal>
                ) : (
                  <p className="mt-3 text-sm text-ink-muted">
                    This article has no section headings.
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-deep">
                  Share
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {shareLinks(post).map((link) => {
                    const Icon = "isWhatsApp" in link ? null : link.icon;
                    return (
                      <a
                        key={link.label}
                        href={link.href}
                        target={
                          link.href.startsWith("mailto:") ? undefined : "_blank"
                        }
                        rel={
                          link.href.startsWith("mailto:")
                            ? undefined
                            : "noopener noreferrer"
                        }
                        aria-label={`Share on ${link.label}`}
                        className="inline-flex size-11 items-center justify-center rounded-full border border-line text-ink-muted hover:border-brand-deep hover:text-brand-deep"
                      >
                        {"isWhatsApp" in link ? (
                          <WhatsAppIcon size={18} />
                        ) : Icon ? (
                          <Icon size={18} aria-hidden="true" />
                        ) : null}
                      </a>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-ink-muted">
                  <Share2
                    size={13}
                    className="mr-1 inline"
                    aria-hidden="true"
                  />
                  Share this article
                </p>
              </div>
            </aside>
          </div>
          {relatedPosts.length > 0 ? (
            <section
              className="section-tint mt-20 rounded-panel border border-line p-6 pt-12 sm:p-10"
              aria-labelledby="related-posts-heading"
            >
              <SectionHeading eyebrow="Keep reading" title="Related articles" />
              <RevealGroup
                id="related-posts-heading"
                className="mt-8 grid gap-6 md:grid-cols-3"
              >
                {relatedPosts.map((related) => (
                  <Reveal key={related.id}>
                    <BlogCard post={related} />
                  </Reveal>
                ))}
              </RevealGroup>
            </section>
          ) : null}
        </Container>
        <section className="section-gradient"><Container className="section-space text-center"><p className="eyebrow">Plan the next step</p><h2 className="mx-auto mt-3 max-w-2xl font-heading text-h2 font-semibold">Have a construction question of your own?</h2><p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-dark/75">Share the context with our team and start a practical conversation.</p><Link href="/contact" className="mt-7 inline-flex min-h-12 items-center rounded-pill bg-dark px-6 font-semibold text-white transition-transform hover:-translate-y-0.5">Talk to the team <span className="ml-2" aria-hidden="true">{"\u2197"}</span></Link></Container></section>
      </article>
    </>
  );
}
