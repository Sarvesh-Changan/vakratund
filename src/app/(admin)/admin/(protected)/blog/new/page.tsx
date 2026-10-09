import { BlogPostForm, PageHeader } from "@/components/admin";
import { requirePermission } from "@/lib/auth/session";
import { listBlogAuthors, listBlogCategories } from "@/server/services/blog";
import { listMediaAssets } from "@/server/services/media";

export default async function NewBlogPostPage() { await requirePermission("content:write"); const [categories, authors, assets] = await Promise.all([listBlogCategories(), listBlogAuthors(), listMediaAssets()]); return <div className="space-y-6"><PageHeader title="New blog post" eyebrow="Blog" description="Write a Markdown article, preview its sanitized output, and publish now or schedule it." /><BlogPostForm initial={null} categories={categories} authors={authors} assets={assets.filter((asset) => asset.kind === "IMAGE")} /></div>; }
