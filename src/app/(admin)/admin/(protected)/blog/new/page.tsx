import { BlogPostForm, PageHeader } from "@/components/admin";
import { requirePermission } from "@/lib/auth/session";
import { listBlogAuthors, listBlogCategories } from "@/server/services/blog";

export default async function NewBlogPostPage() { await requirePermission("content:write"); const [categories, authors] = await Promise.all([listBlogCategories(), listBlogAuthors()]); return <div className="space-y-6"><PageHeader title="New blog post" eyebrow="Blog" description="Write a Markdown article, preview its sanitized output, and publish now or schedule it." /><BlogPostForm initial={null} categories={categories} authors={authors} /></div>; }
