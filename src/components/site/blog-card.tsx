import { ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import Link from "next/link";
import { CloudImage } from "@/components/cloud-image";
import { HoverCard, MaskImage } from "@/components/motion";
import { Badge, Card } from "@/components/ui";
import type { PublishedBlogPost } from "@/server/queries/blog";

export function BlogCard({ post, featured = false }: { post: PublishedBlogPost; featured?: boolean }) {
  return (
    <HoverCard className="h-full rounded-card">
      <Card className={`group relative h-full overflow-hidden p-0 ${featured ? "lg:grid lg:grid-cols-[1.15fr_0.85fr]" : ""}`}>
        <MaskImage>
          <div className={`relative overflow-hidden bg-dark ${featured ? "aspect-[16/10] lg:aspect-auto lg:min-h-80" : "aspect-[4/3]"}`}>
            {post.cover ? (
              <CloudImage
                src={post.cover.url}
                alt={post.cover.alt}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                data-hover-image
                className="object-cover"
              />
            ) : (
              <div className="home-blueprint-pattern flex size-full items-center justify-center bg-gradient-to-br from-dark via-dark to-accent/30" aria-hidden="true"><span className="font-heading text-7xl font-bold text-white/15">{post.publishedAt.slice(0, 4)}</span></div>
            )}
          </div>
        </MaskImage>
        <div className={`flex flex-col p-6 ${featured ? "lg:justify-center lg:p-10" : ""}`}>
          <div className="flex flex-wrap items-center gap-2">
            {post.category ? (
              <Badge variant="brand">{post.category.name}</Badge>
            ) : null}
            <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
              <Clock3 size={14} aria-hidden="true" />
              {post.readingMins} min read
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-ink-muted"><CalendarDays size={14} aria-hidden="true" />{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(post.publishedAt))}</span>
          </div>
          <h2 className="mt-4 font-heading text-h3 font-semibold">
            <Link
              href={`/blog/${post.slug}`}
              className="after:absolute after:inset-0"
            >
              {post.title}
            </Link>
          </h2>
          <p className="mt-3 line-clamp-3 text-sm leading-7 text-ink-muted">
            {post.excerpt}
          </p>
          <span className="relative mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-deep">
            Read article{" "}
            <ArrowRight size={16} data-hover-arrow aria-hidden="true" />
          </span>
        </div>
      </Card>
    </HoverCard>
  );
}
