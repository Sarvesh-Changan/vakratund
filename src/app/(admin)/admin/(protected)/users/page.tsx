import { PageHeader, UsersManager } from "@/components/admin";
import { requireRole } from "@/lib/auth/session";
import { listActiveLockouts, listUsers } from "@/server/services/users";
export default async function UsersPage() { await requireRole("SUPER_ADMIN"); const users = await listUsers(); const lockouts = await listActiveLockouts(users); return <div className="space-y-8"><PageHeader title="Users" description="Manage staff accounts, roles, activation state, sessions, and password resets." breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Users" }]} /><UsersManager initial={users} lockouts={lockouts} /></div>; }
