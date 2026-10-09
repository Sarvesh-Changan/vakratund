import { notFound } from "next/navigation";

import { PageHeader, TeamForm } from "@/components/admin";
import { requirePermission } from "@/lib/auth/session";
import { getTeamMember } from "@/server/services/team";
import { listMediaAssets } from "@/server/services/media";

export default async function EditTeamPage({ params }: { params: Promise<{ id: string }> }) { await requirePermission("content:write"); const { id } = await params; const [member, assets] = await Promise.all([getTeamMember(id), listMediaAssets()]); if (!member) notFound(); return <div className="space-y-6"><PageHeader title={`Edit team member: ${member.name}`} eyebrow="Team" description="Update approved profile information, photo, ordering, or visibility." /><TeamForm initial={member} assets={assets.filter((asset) => asset.kind === "IMAGE")} /></div>; }
