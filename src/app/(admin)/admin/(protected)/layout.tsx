import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin";
import { isRole } from "@/config/permissions";
import { requireSession } from "@/lib/auth/session";
import { sessionTimeoutConfig } from "@/lib/auth/session-timeout";

export default async function ProtectedAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSession();
  if (session.user.mustChangePassword) redirect("/admin/change-password");
  if (!isRole(session.user.role)) redirect("/admin/login");
  const timeout = sessionTimeoutConfig();

  return <AdminShell userId={session.user.id} name={session.user.name} email={session.user.email} role={session.user.role} sessionTimeout={{ idleTimeoutSeconds: timeout.idleTimeoutMs / 1000, warningSeconds: timeout.warningMs / 1000, absoluteTimeoutSeconds: timeout.absoluteTimeoutMs / 1000 }}>{children}</AdminShell>;
}
