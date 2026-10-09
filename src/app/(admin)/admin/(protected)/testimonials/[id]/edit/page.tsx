import { notFound } from "next/navigation";

import { PageHeader, TestimonialForm } from "@/components/admin";
import { requirePermission } from "@/lib/auth/session";
import { listProjects } from "@/server/services/projects";
import { getTestimonial } from "@/server/services/testimonials";

export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) { await requirePermission("content:write"); const { id } = await params; const [testimonial, projects] = await Promise.all([getTestimonial(id), listProjects()]); if (!testimonial) notFound(); return <div className="space-y-6"><PageHeader title={`Edit testimonial: ${testimonial.name}`} eyebrow="Testimonials" description="Update approved testimonial content and publication settings." /><TestimonialForm initial={testimonial} projects={projects.map(({ id: projectId, title }) => ({ id: projectId, title }))} /></div>; }
