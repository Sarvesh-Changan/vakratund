"use client";

import { ArrowRight, Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ResolvedSiteSettings } from "@/config/site";
import { primaryNavigation } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { ContactLink, TrackedWhatsAppLink } from "./contact-link";
import { phoneHref } from "./contact-utils";
import { BrandLogo } from "@/components/brand-logo";
import { DesktopServicesNavigation, MobileServicesAccordion } from "./site-services-navigation";
import { QuoteHeaderButton } from "./quote-header-button";
import styles from "./site-services-navigation.module.css";

export type HeaderService = { slug: string; title: string; shortDesc: string; iconKey: string | null; cover: { url: string; alt: string } | null };

export function SiteHeader({ settings, services, overlayAtTop = false }: { settings: ResolvedSiteSettings; services: HeaderService[]; overlayAtTop?: boolean }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const portalReady = typeof document !== "undefined";
  const [navHoverToken, setNavHoverToken] = useState(0);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const previousPathname = useRef(pathname);
  const touchStartX = useRef<number | null>(null);
  const phone = settings.phones[0];
  const transparent = overlayAtTop && !scrolled && !menuOpen;

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const current = window.scrollY;
        setScrolled(current > 16);
        if (current < 80 || menuOpen) setHeaderVisible(true);
        else if (current - lastScrollY.current > 7) setHeaderVisible(false);
        else if (lastScrollY.current - current > 5) setHeaderVisible(true);
        lastScrollY.current = current;
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", update); };
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    closeMenu();
  }, [closeMenu, pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.dataset.mobileDrawerOpen = "true";
    const page = document.querySelector<HTMLElement>("[data-public-site]");
    const previousInert = page?.inert ?? false;
    const previousAriaHidden = page?.getAttribute("aria-hidden");
    const previousBodyPosition = document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyWidth = document.body.style.width;
    const previousBodyPaddingRight = document.body.style.paddingRight;
    const menuButton = menuButtonRef.current;
    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    if (page) {
      page.inert = true;
      page.setAttribute("aria-hidden", "true");
    }
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    const frame = requestAnimationFrame(() => drawerRef.current?.querySelector<HTMLElement>("a[href], button:not([disabled])")?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = [...drawerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter((element) => !element.hasAttribute("hidden"));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !drawerRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !drawerRef.current.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    const resize = () => { if (window.innerWidth >= 1024) closeMenu(); };
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", resize);

    return () => {
      delete document.body.dataset.mobileDrawerOpen;
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", resize);
      if (page) {
        page.inert = previousInert;
        if (previousAriaHidden === null || previousAriaHidden === undefined) page.removeAttribute("aria-hidden");
        else page.setAttribute("aria-hidden", previousAriaHidden);
      }
      document.body.style.position = previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.width = previousBodyWidth;
      document.body.style.paddingRight = previousBodyPaddingRight;
      window.scrollTo(0, scrollY);
      requestAnimationFrame(() => menuButton?.focus());
    };
  }, [closeMenu, menuOpen]);

  const navLinkClass = "rounded-control px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-tint hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
  const dismissServices = () => setNavHoverToken((token) => token + 1);

  const drawer = menuOpen && portalReady ? createPortal(
    <div className="site-drawer-layer" data-testid="mobile-drawer-layer">
      <button className="site-drawer-backdrop" type="button" aria-label="Close menu" onClick={closeMenu} />
      <aside ref={drawerRef} id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Main menu" className="site-mobile-drawer" onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => {
        const start = touchStartX.current;
        const end = event.changedTouches[0]?.clientX;
        if (start !== null && end !== undefined && end - start > 80) closeMenu();
        touchStartX.current = null;
      }}>
        <div className="site-drawer-inner">
          <div className="site-drawer-top">
            <Link href="/" onClick={closeMenu} className="flex min-w-0 items-center gap-2" aria-label={`${settings.businessName} home`}>
              <BrandLogo width={38} height={38} className="size-9 shrink-0" />
              <span className="brand-wordmark min-w-0 truncate text-base font-bold text-white">{settings.businessName.replace(/^M\/s\.\s*/, "")}</span>
            </Link>
            <button type="button" className="site-drawer-close" onClick={closeMenu} aria-label="Close navigation drawer"><X size={23} aria-hidden="true" /></button>
          </div>
          <nav aria-label="Main" className="site-drawer-links">
            <Link href="/" className="site-drawer-link" onClick={closeMenu}>Home</Link>
            <Link href="/about" className="site-drawer-link" onClick={closeMenu}>About</Link>
            <MobileServicesAccordion services={services} onRoute={closeMenu} />
            {primaryNavigation.filter((item) => ["Projects", "Gallery", "Contact"].includes(item.label)).map((item) => <Link key={item.href} href={item.href} className="site-drawer-link" onClick={closeMenu}>{item.label}</Link>)}
          </nav>
          <div className="site-drawer-actions">
            <Link href="/estimate" className="site-drawer-quote" onClick={closeMenu}>Get Free Quote <ArrowRight size={18} aria-hidden="true" /></Link>
            <div className="grid grid-cols-2 gap-2">
              {phone ? <ContactLink href={phoneHref(phone)} eventType="CALL" context="mobile-header-phone" onClick={closeMenu} className="site-drawer-contact"><Phone size={18} aria-hidden="true" />Call</ContactLink> : null}
              <TrackedWhatsAppLink settings={settings} whatsappContext={{ pageTitle: "Mobile navigation" }} context="mobile-header-whatsapp" target="_blank" rel="noopener noreferrer" className="site-drawer-contact"><WhatsAppIcon size={18} />WhatsApp</TrackedWhatsAppLink>
            </div>
          </div>
        </div>
      </aside>
    </div>, document.body,
  ) : null;

  return <>
    <header onFocusCapture={() => setHeaderVisible(true)} className={cn("fixed inset-x-3 top-3 z-[var(--z-header)] mx-auto h-16 max-w-[1300px] rounded-pill border text-ink shadow-soft transition-[transform,box-shadow] duration-300 motion-reduce:transition-none", transparent ? "border-line bg-white/90 backdrop-blur-xl" : "border-line bg-white/95 shadow-raised backdrop-blur-xl", !headerVisible && !menuOpen && "-translate-y-[calc(100%+1rem)]")}>
      <div className="relative mx-auto flex h-full min-w-0 items-center justify-between gap-2 px-2 sm:gap-3 sm:px-5 lg:px-6">
        <Link href="/" onClick={closeMenu} className="group flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-control" aria-label={`${settings.businessName} home`}>
          <BrandLogo width={42} height={42} priority className="size-10 shrink-0" />
          <span className="brand-wordmark min-w-0 truncate text-[13px] font-bold leading-none tracking-tight sm:text-base">{settings.businessName.replace(/^M\/s\.\s*/, "")}</span>
        </Link>
        <nav className={cn("hidden items-center gap-0.5 lg:flex", styles.desktopNav)} aria-label="Main">
          <Link href="/" className={navLinkClass} onPointerEnter={dismissServices}>Home</Link>
          <Link href="/about" className={navLinkClass} onPointerEnter={dismissServices}>About</Link>
          <DesktopServicesNavigation services={services} phone={phone} navLinkClass={navLinkClass} closeToken={navHoverToken} />
          {primaryNavigation.filter((item) => ["Projects", "Gallery", "Contact"].includes(item.label)).map((item) => <Link key={item.href} href={item.href} className={navLinkClass} onPointerEnter={dismissServices}>{item.label}</Link>)}
        </nav>
        <div className="hidden shrink-0 items-center gap-2 xl:flex">
          {phone ? <ContactLink href={phoneHref(phone)} eventType="CALL" context="header-phone" className="inline-flex min-h-11 items-center gap-2 rounded-control border border-line px-3 text-sm font-semibold text-ink-muted hover:border-accent hover:text-ink"><Phone size={15} aria-hidden="true" /><span>Call</span></ContactLink> : null}
          <TrackedWhatsAppLink settings={settings} whatsappContext={{ pageTitle: "Header" }} context="header-whatsapp" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" className="inline-flex size-11 items-center justify-center rounded-full bg-whatsapp text-white shadow-soft hover:-translate-y-0.5"><WhatsAppIcon size={18} /></TrackedWhatsAppLink>
          <QuoteHeaderButton />
        </div>
        {phone ? <ContactLink href={phoneHref(phone)} eventType="CALL" context="header-phone-compact" className="ml-auto hidden min-h-11 shrink-0 items-center gap-2 rounded-control border border-line px-3 text-sm font-semibold text-ink-muted hover:border-accent hover:text-ink lg:inline-flex xl:hidden"><Phone size={15} aria-hidden="true" /><span>Call</span></ContactLink> : null}
        <QuoteHeaderButton className="hidden shrink-0 px-3 md:inline-flex xl:hidden" />
        <button ref={menuButtonRef} type="button" className={cn("relative inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-ink hover:bg-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:hidden", styles.mobileToggle)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
          <Menu size={23} aria-hidden="true" className={cn("absolute transition-[opacity,transform] duration-200 motion-reduce:transition-none", menuOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100")} />
          <X size={23} aria-hidden="true" className={cn("absolute transition-[opacity,transform] duration-200 motion-reduce:transition-none", menuOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0")} />
        </button>
      </div>
    </header>
    {drawer}
  </>;
}
