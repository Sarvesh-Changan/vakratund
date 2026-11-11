"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { can, isRole } from "@/config/permissions";
import type { Role } from "@/generated/prisma/enums";
import { Breadcrumbs, Button } from "@/components/ui";
import { focusRing } from "@/components/ui/styles";
import { cn } from "@/lib/utils";
import { ADMIN_NAVIGATION } from "@/components/admin/admin-navigation";
import { LogoutButton } from "@/app/(admin)/admin/logout-button";
import { BrandLogo } from "@/components/brand-logo";
import { IdleSessionGuard } from "./idle-session-guard";
import { SignOutOtherDevicesButton } from "./sign-out-other-devices-button";

export function AdminShell({
  children,
  userId,
  name,
  email,
  role,
  sessionTimeout,
}: {
  children: React.ReactNode;
  userId: string;
  name: string;
  email: string;
  role: Role;
  sessionTimeout: { idleTimeoutSeconds: number; warningSeconds: number; absoluteTimeoutSeconds: number };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const closeNavigation = useCallback(() => setOpen(false), []);
  const items = useMemo(
    () =>
      ADMIN_NAVIGATION.filter((item) =>
        item.permissions.some((permission) => can(role, permission)),
      ),
    [role],
  );
  const current = items.find(
    (item) =>
      item.href === pathname ||
      (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)),
  );
  const safeRole = isRole(role) ? role : "EDITOR";

  const previousPathname = useRef(pathname);
  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    closeNavigation();
  }, [closeNavigation, pathname]);
  useEffect(() => {
    if (!open) return;
    const content = document.querySelector<HTMLElement>(".admin-shell > .min-w-0");
    const previousInert = content?.inert ?? false;
    const previousAriaHidden = content?.getAttribute("aria-hidden");
    const previousBodyPosition = document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyWidth = document.body.style.width;
    const previousBodyPaddingRight = document.body.style.paddingRight;
    const scrollY = window.scrollY;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (content) {
      content.inert = true;
      content.setAttribute("aria-hidden", "true");
    }
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`;
    const frame = requestAnimationFrame(() => navRef.current?.querySelector<HTMLElement>("button, a[href]")?.focus());
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeNavigation();
      }
      if (event.key !== "Tab" || !navRef.current) return;
      const items = [...navRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const resize = () => { if (window.innerWidth >= 1024) closeNavigation(); };
    document.addEventListener("keydown", keydown);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", keydown);
      window.removeEventListener("resize", resize);
      if (content) {
        content.inert = previousInert;
        if (previousAriaHidden === null || previousAriaHidden === undefined) content.removeAttribute("aria-hidden");
        else content.setAttribute("aria-hidden", previousAriaHidden);
      }
      document.body.style.position = previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.width = previousBodyWidth;
      document.body.style.paddingRight = previousBodyPaddingRight;
      window.scrollTo(0, scrollY);
      requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(".admin-menu-toggle")?.focus());
    };
  }, [closeNavigation, open]);

  return (
    <div className="admin-shell admin-theme min-h-screen overflow-x-clip lg:flex">
      <IdleSessionGuard userId={userId} {...sessionTimeout} />
      <div
        className={cn(
          "fixed inset-0 z-[var(--z-backdrop)] bg-charcoal/50 lg:hidden",
          !open && "hidden",
        )}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />
      <aside
        ref={navRef}
        id="admin-navigation"
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-label="Admin navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-[var(--z-drawer)] flex h-screen max-h-screen w-[min(84vw,18rem)] flex-col overscroll-contain border-r bg-surface p-4 shadow-raised lg:static lg:z-auto lg:h-auto lg:max-h-none lg:w-64 lg:translate-x-0 lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b pb-4">
          <Link
            href="/admin"
            onClick={closeNavigation}
            className="font-heading text-lg font-semibold"
          >
            <BrandLogo width={42} height={42} className="size-10 shrink-0" />
            <span>Vakratund<span className="text-brand-deep">.</span></span>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-11 lg:hidden"
            onClick={closeNavigation}
            aria-label="Close navigation"
          >
            ×
          </Button>
        </div>
        <nav
          className="mt-4 flex-1 space-y-1 overflow-y-auto"
          aria-label="Admin modules"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeNavigation}
              className={cn(
                "block min-h-11 rounded-control px-3 py-2.5 text-sm font-semibold text-ink-muted hover:bg-surface-alt hover:text-ink",
                focusRing,
                (pathname === item.href ||
                  (item.href !== "/admin" &&
                    pathname.startsWith(`${item.href}/`))) &&
                  "bg-surface-alt text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t pt-4 text-xs text-ink-muted">
          Signed in as{" "}
          <span className="font-semibold text-ink">{safeRole}</span>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-[var(--z-header)] border-b bg-bg/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="admin-menu-toggle lg:hidden"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="admin-navigation"
            >
              Menu
            </Button>
            <div className="hidden min-w-0 flex-1 lg:block">
              <Breadcrumbs
                items={[
                  { label: "Admin", href: "/admin" },
                  ...(current && current.href !== "/admin"
                    ? [{ label: current.label }]
                    : []),
                ]}
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <LogoutButton />
              <details className="relative">
                <summary
                  className={cn(
                    "flex min-h-11 max-w-[12rem] cursor-pointer list-none items-center gap-2 rounded-control px-2 text-left hover:bg-surface-alt",
                    focusRing,
                  )}
                >
                  <span className="hidden truncate text-sm font-semibold sm:block">
                    {name}
                  </span>
                  <span
                    aria-hidden="true"
                    className="rounded-pill bg-brand/20 px-2 py-1 text-xs font-bold text-brand-deep"
                  >
                    {safeRole.slice(0, 2)}
                  </span>
                </summary>
                <div className="absolute right-0 mt-2 w-64 rounded-card border bg-surface p-3 shadow-raised">
                  <p className="truncate text-sm font-semibold">{name}</p>
                  <p className="truncate text-xs text-ink-muted">{email}</p>
                  <Link
                    className="mt-3 block rounded-control px-2 py-2 text-sm hover:bg-surface-alt"
                    href="/admin/change-password"
                  >
                    Change password
                  </Link>
                  <SignOutOtherDevicesButton />
                </div>
              </details>
            </div>
          </div>
          <div className="mt-3 lg:hidden">
            <Breadcrumbs
              items={[
                { label: "Admin", href: "/admin" },
                ...(current && current.href !== "/admin"
                  ? [{ label: current.label }]
                  : []),
              ]}
            />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-24 md:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
