import { notFound } from "next/navigation";

import { BlogPostForm, PageHeader } from "@/components/admin";
import { requirePermission } from "@/lib/auth/session";
import { listBlogAuthors, listBlogCategories, getBlogPost } from "@/server/services/blog";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) { await requirePermission("content:write"); const { id } = await params; const [post, categories, authors] = await Promise.all([getBlogPost(id), listBlogCategories(), listBlogAuthors()]); if (!post) notFound(); return <div className="space-y-6"><PageHeader title={`Edit post: ${post.title}`} eyebrow="Blog" description="Update Markdown content, taxonomy, scheduling, and search metadata." /><BlogPostForm initial={post} categories={categories} authors={authors} /></div>; }
