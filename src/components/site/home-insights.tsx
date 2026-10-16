import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomeInsightsSection } from "@/server/queries/home";
import type { PublishedBlogPost } from "@/server/queries/blog";
import { BlogCard } from "@/components/site/blog-card";
import { Container, SectionHeading } from "@/components/ui";

export function HomeInsights({ posts, section }: { posts: PublishedBlogPost[]; section: HomeInsightsSection | null }) {
  if (posts.length === 0 || !section) return null;
  return <section className="bg-bg"><Container className="section-space-generous"><SectionHeading eyebrow={section.eyebrow || undefined} title={section.title} action={<Link href="/blog" className="inline-flex min-h-11 items-center gap-2 self-start rounded-control font-semibold text-brand-deep hover:underline">{section.viewAllLabel}<ArrowRight size={17} aria-hidden="true" /></Link>} /><div className="mt-10 grid gap-6 md:grid-cols-2 lg:mt-14 lg:grid-cols-3">{posts.slice(0, 3).map((post) => <BlogCard key={post.id} post={post} />)}</div></Container></section>;
}
