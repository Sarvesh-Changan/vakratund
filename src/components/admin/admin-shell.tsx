"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { can, isRole } from "@/config/permissions";
import type { Role } from "@/generated/prisma/enums";
import { Breadcrumbs, Button } from "@/components/ui";
import { focusRing } from "@/components/ui/styles";
import { cn } from "@/lib/utils";
import { ADMIN_NAVIGATION } from "@/components/admin/admin-navigation";
import { LogoutButton } from "@/app/(admin)/admin/logout-button";

export function AdminShell({ children, name, email, role }: { children: React.ReactNode; name: string; email: string; role: Role }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = useMemo(() => ADMIN_NAVIGATION.filter((item) => item.permissions.some((permission) => can(role, permission))), [role]);
  const current = items.find((item) => item.href === pathname || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)));
  const safeRole = isRole(role) ? role : "EDITOR";

  return <div className="min-h-screen lg:flex"><div className={cn("fixed inset-0 z-40 bg-charcoal/50 lg:hidden", !open && "hidden")} aria-hidden="true" onClick={() => setOpen(false)} /><aside id="admin-navigation" aria-label="Admin navigation" className={cn("fixed inset-y-0 left-0 z-50 flex w-[min(84vw,18rem)] flex-col border-r bg-surface p-4 shadow-raised transition-transform lg:static lg:z-auto lg:w-64 lg:translate-x-0 lg:shadow-none", open ? "translate-x-0" : "-translate-x-full")}><div className="flex items-center justify-between border-b pb-4"><Link href="/admin" onClick={() => setOpen(false)} className="font-heading text-lg font-semibold">Vakratund<span className="text-brand-deep">.</span></Link><Button type="button" variant="ghost" size="sm" className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation">×</Button></div><nav className="mt-4 flex-1 space-y-1 overflow-y-auto" aria-label="Admin modules">{items.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn("block min-h-11 rounded-control px-3 py-2.5 text-sm font-semibold text-ink-muted hover:bg-surface-alt hover:text-ink", focusRing, (pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`))) && "bg-surface-alt text-ink")}>{item.label}</Link>)}</nav><div className="border-t pt-4 text-xs text-ink-muted">Signed in as <span className="font-semibold text-ink">{safeRole}</span></div></aside><div className="min-w-0 flex-1"><header className="sticky top-0 z-30 border-b bg-bg/95 px-4 py-3 backdrop-blur md:px-6"><div className="flex items-center justify-between gap-3"><Button type="button" variant="secondary" size="sm" className="lg:hidden" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="admin-navigation">Menu</Button><div className="hidden min-w-0 flex-1 lg:block"><Breadcrumbs items={[{ label: "Admin", href: "/admin" }, ...(current && current.href !== "/admin" ? [{ label: current.label }] : [])]} /></div><div className="ml-auto flex items-center gap-2"><details className="relative"><summary className={cn("flex min-h-11 max-w-[12rem] cursor-pointer list-none items-center gap-2 rounded-control px-2 text-left hover:bg-surface-alt", focusRing)}><span className="hidden truncate text-sm font-semibold sm:block">{name}</span><span aria-hidden="true" className="rounded-pill bg-brand/20 px-2 py-1 text-xs font-bold text-brand-deep">{safeRole.slice(0, 2)}</span></summary><div className="absolute right-0 mt-2 w-64 rounded-card border bg-surface p-3 shadow-raised"><p className="truncate text-sm font-semibold">{name}</p><p className="truncate text-xs text-ink-muted">{email}</p><Link className="mt-3 block rounded-control px-2 py-2 text-sm hover:bg-surface-alt" href="/admin/change-password">Change password</Link><LogoutButton /></div></details></div></div><div className="mt-3 lg:hidden"><Breadcrumbs items={[{ label: "Admin", href: "/admin" }, ...(current && current.href !== "/admin" ? [{ label: current.label }] : [])]} /></div></header><main className="mx-auto w-full max-w-7xl px-4 py-6 pb-24 md:px-6 lg:px-8">{children}</main></div></div>;
}
