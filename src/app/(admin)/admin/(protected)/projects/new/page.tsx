import { PageHeader } from "@/components/admin";
import { ProjectForm } from "@/components/admin/project-form";
import { requirePermission } from "@/lib/auth/session";
import { listMediaAssets } from "@/server/services/media";
import { listServices } from "@/server/services/services";

export default async function NewProjectPage() {
  await requirePermission("content:write");
  const [assets, services] = await Promise.all([listMediaAssets(), listServices()]);
  return <div className="space-y-6"><PageHeader title="New project" eyebrow="Projects" description="Create a portfolio project with project facts, ordered media, publication controls, and SEO metadata." /><ProjectForm initial={null} assets={assets.filter((asset) => asset.kind !== "DOCUMENT")} services={services.map(({ id, title }) => ({ id, title }))} /></div>;
}

