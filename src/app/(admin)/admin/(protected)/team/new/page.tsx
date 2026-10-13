import { PageHeader, TeamForm } from "@/components/admin";
import { requirePermission } from "@/lib/auth/session";

export default async function NewTeamPage() { await requirePermission("content:write"); return <div className="space-y-6"><PageHeader title="New team member" eyebrow="Team" description="Add a team member with an optional approved profile photo." /><TeamForm initial={null} /></div>; }
