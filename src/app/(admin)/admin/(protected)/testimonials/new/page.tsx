import { PageHeader, TestimonialForm } from "@/components/admin";
import { requirePermission } from "@/lib/auth/session";
import { listProjects } from "@/server/services/projects";

export default async function NewTestimonialPage() { await requirePermission("content:write"); const projects = await listProjects(); return <div className="space-y-6"><PageHeader title="New testimonial" eyebrow="Testimonials" description="Add approved customer feedback for the public site." /><TestimonialForm initial={null} projects={projects.map(({ id, title }) => ({ id, title }))} /></div>; }
