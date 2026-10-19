import { PageHeader, SettingsForm } from "@/components/admin";
import { requirePermission } from "@/lib/auth/session";
import { getSettings } from "@/server/services/settings";
export default async function SettingsPage() { await requirePermission("settings:write"); const settings = await getSettings(); return <div className="space-y-8"><PageHeader title="Settings" description="Manage business details, contact channels, hours, WhatsApp, and notifications." breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Settings" }]} /><SettingsForm initial={settings} /></div>; }
