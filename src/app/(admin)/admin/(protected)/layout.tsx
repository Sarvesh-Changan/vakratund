import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin";
import { isRole } from "@/config/permissions";
import { requireSession } from "@/lib/auth/session";

export default async function ProtectedAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSession();
  if (session.user.mustChangePassword) redirect("/admin/change-password");
  if (!isRole(session.user.role)) redirect("/admin/login");

  return <AdminShell name={session.user.name} email={session.user.email} role={session.user.role}>{children}</AdminShell>;
}
