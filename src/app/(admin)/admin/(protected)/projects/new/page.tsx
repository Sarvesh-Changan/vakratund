import { PageHeader } from "@/components/admin";
import { ProjectForm } from "@/components/admin/project-form";
import { requirePermission } from "@/lib/auth/session";
import { listServices } from "@/server/services/services";

export default async function NewProjectPage() {
  await requirePermission("content:write");
  const services = await listServices();
  return <div className="space-y-6"><PageHeader title="New project" eyebrow="Projects" description="Create a portfolio project with project facts, ordered media, and publication controls." /><ProjectForm initial={null} assets={[]} services={services.map(({ id, title }) => ({ id, title }))} /></div>;
}

