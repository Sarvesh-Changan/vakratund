import { PageHeader, TeamForm } from "@/components/admin";
import { requirePermission } from "@/lib/auth/session";
import { listMediaAssets } from "@/server/services/media";

export default async function NewTeamPage() { await requirePermission("content:write"); const assets = await listMediaAssets(); return <div className="space-y-6"><PageHeader title="New team member" eyebrow="Team" description="Add a team member with an optional approved profile photo." /><TeamForm initial={null} assets={assets.filter((asset) => asset.kind === "IMAGE")} /></div>; }
