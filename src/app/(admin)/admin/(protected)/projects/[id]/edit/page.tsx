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
  const projectMediaIds = new Set(project.media.map((item) => item.mediaId));
  const projectAssets = assets.filter((asset) => asset.kind !== "DOCUMENT" && projectMediaIds.has(asset.id));
  return <div className="space-y-6"><PageHeader title={`Edit ${project.title}`} eyebrow="Projects" /><ProjectForm initial={project} assets={projectAssets} services={services.map(({ id: serviceId, title }) => ({ id: serviceId, title }))} /></div>;
}

