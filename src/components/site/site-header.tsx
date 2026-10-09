"use client";

import { Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { siteNavigation, type ResolvedSiteSettings } from "@/config/site";
import { cn } from "@/lib/utils";
import { phoneHref } from "./contact-utils";

export function SiteHeader({ settings }: { settings: ResolvedSiteSettings }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuWasOpen = useRef(false);
  const closeMenu = () => {
    setMenuOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  };
  const isHomeAtTop = pathname === "/" && !scrolled;

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 12);
    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      menuWasOpen.current = true;
      return undefined;
    }
    if (menuWasOpen.current) {
      menuWasOpen.current = false;
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    }
    return undefined;
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const phone = settings.phones[0];

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 h-20 border-b transition-colors duration-300", isHomeAtTop ? "border-transparent bg-charcoal/95 text-white" : "border-line/80 bg-charcoal/95 text-white shadow-soft backdrop-blur-md")}>
      <div className="mx-auto flex h-full max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex min-h-11 items-center gap-2 rounded-control" aria-label={`${settings.businessName} home`}>
          <span className="flex size-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-ink transition-transform group-hover:rotate-6" aria-hidden="true">V</span>
          <span className="max-w-[11rem] font-heading text-sm font-bold leading-tight tracking-tight sm:max-w-none sm:text-base">{settings.businessName.replace(/^M\/s\.\s*/, "")}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {siteNavigation.map((item) => (
            <a key={item.href} href={item.href} className="rounded-control px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white">{item.label}</a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {phone ? <a href={phoneHref(phone)} data-contact-type="CALL" data-contact-context="header-phone" className="inline-flex min-h-11 items-center gap-2 rounded-control px-2 text-sm font-semibold text-white/90 hover:text-white"><Phone size={16} aria-hidden="true" /> <span>{phone.replace("+91", "")}</span></a> : null}
          <a href="/estimate" className="inline-flex min-h-11 items-center justify-center rounded-control bg-brand px-4 text-sm font-bold text-brand-ink transition-colors hover:bg-brand/90">Get Free Quote</a>
        </div>

        <button ref={menuButtonRef} type="button" className="inline-flex size-11 items-center justify-center rounded-control text-white hover:bg-white/10 lg:hidden" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); closeMenu(); event.currentTarget.focus(); } }} onClick={() => { if (menuOpen) closeMenu(); else { setMenuOpen(true); menuButtonRef.current?.focus(); } }}>
          {menuOpen ? <X size={23} aria-hidden="true" /> : <Menu size={23} aria-hidden="true" />}
        </button>
      </div>

      <div id="mobile-navigation" className={cn("absolute inset-x-0 top-20 border-b border-line bg-charcoal px-4 py-4 shadow-raised lg:hidden", menuOpen ? "block" : "hidden")}>
        <nav aria-label="Mobile navigation" className="mx-auto flex max-w-[1240px] flex-col gap-1">
          {siteNavigation.map((item) => <a key={item.href} href={item.href} className="min-h-11 rounded-control px-3 py-2 text-base font-medium text-white/90 hover:bg-white/10" onClick={() => setMenuOpen(false)}>{item.label}</a>)}
          {phone ? <a href={phoneHref(phone)} data-contact-type="CALL" data-contact-context="mobile-header-phone" className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-control px-3 py-2 text-base font-semibold text-white/90" onClick={() => setMenuOpen(false)}><Phone size={18} aria-hidden="true" /> Call {phone.replace("+91", "")}</a> : null}
          <a href="/estimate" className="mt-2 inline-flex min-h-12 items-center justify-center rounded-control bg-brand px-4 font-bold text-brand-ink" onClick={() => setMenuOpen(false)}>Get Free Quote</a>
        </nav>
      </div>
    </header>
  );
}
