import type { Metadata } from "next";
import { ProjectsPage } from "@/components/site/projects-page";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPublishedProjects } from "@/server/queries/projects";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/projects", fallbackTitle: "Projects", fallbackDescription: "Selected construction, turnkey, repair survey and rehabilitation projects." });
}

export default async function ProjectsRoute() {
  const projects = await getPublishedProjects().catch(() => []);
  return <ProjectsPage projects={projects} />;
}
