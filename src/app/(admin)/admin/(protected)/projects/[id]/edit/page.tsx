import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin";
import { ProjectForm } from "@/components/admin/project-form";
import { requirePermission } from "@/lib/auth/session";
import { listMediaAssets } from "@/server/services/media";
import { getProject } from "@/server/services/projects";
import { listServices } from "@/server/services/services";

type Params = Promise<{ id: string }>;

export default async function EditProjectPage({ params }: { params: Params }) {
  await requirePermission("content:write");
  const { id } = await params;
  const [project, assets, services] = await Promise.all([getProject(id), listMediaAssets(), listServices()]);
  if (!project) notFound();
  return <div className="space-y-6"><PageHeader title={`Edit ${project.title}`} eyebrow="Projects" description="Update the project record, privacy toggle, media ordering, publication, and SEO." /><ProjectForm initial={project} assets={assets.filter((asset) => asset.kind !== "DOCUMENT")} services={services.map(({ id: serviceId, title }) => ({ id: serviceId, title }))} /></div>;
}

