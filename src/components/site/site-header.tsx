"use client";

import { Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  const [scrolled, setScrolled] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navHoverToken, setNavHoverToken] = useState(0);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
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

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => {
      menuPanelRef.current?.querySelector<HTMLElement>("a[href], button:not([disabled])")?.focus();
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        requestAnimationFrame(() => menuButtonRef.current?.focus());
        return;
      }
      if (event.key !== "Tab" || !menuPanelRef.current) return;
      const focusable = [...menuPanelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter((element) => !element.hasAttribute("hidden"));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const navLinkClass = "rounded-control px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-tint hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
  const dismissServices = () => setNavHoverToken((token) => token + 1);

  return (
    <header onFocusCapture={() => setHeaderVisible(true)} className={cn("fixed inset-x-3 top-3 z-50 mx-auto h-16 max-w-[1300px] rounded-pill border text-ink shadow-soft transition-[transform,height,box-shadow] duration-300 motion-reduce:transition-none", transparent ? "border-line bg-white/90 backdrop-blur-xl" : "border-line bg-white/95 shadow-raised backdrop-blur-xl", scrolled && "h-14", !headerVisible && !menuOpen && "-translate-y-[calc(100%+1rem)]")}>
      <div className="relative z-50 mx-auto flex h-full items-center justify-between gap-3 px-3 sm:px-5 lg:px-6">
        <Link href="/" onClick={() => setMenuOpen(false)} className="group flex min-h-11 shrink-0 items-center gap-2 rounded-control" aria-label={`${settings.businessName} home`}>
          <BrandLogo width={42} height={42} priority className="size-10 shrink-0" />
          <span className="brand-wordmark max-w-[12rem] text-[13px] font-bold leading-none tracking-tight sm:max-w-none sm:text-base">{settings.businessName.replace(/^M\/s\.\s*/, "")}</span>
        </Link>

        <nav className={cn("hidden items-center gap-0.5 lg:flex", styles.desktopNav)} aria-label="Main">
          <Link href="/" className={navLinkClass} onPointerEnter={dismissServices}>Home</Link>
          <Link href="/about" className={navLinkClass} onPointerEnter={dismissServices}>About</Link>
          <DesktopServicesNavigation services={services} phone={phone} navLinkClass={navLinkClass} closeToken={navHoverToken} />
          {primaryNavigation.filter((item) => item.label === "Projects" || item.label === "Gallery" || item.label === "Contact").map((item) => <Link key={item.href} href={item.href} className={navLinkClass} onPointerEnter={dismissServices}>{item.label}</Link>)}
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          {phone ? <ContactLink href={phoneHref(phone)} eventType="CALL" context="header-phone" className="inline-flex min-h-10 items-center gap-2 rounded-control border border-line px-3 text-sm font-semibold text-ink-muted hover:border-accent hover:text-ink"><Phone size={15} aria-hidden="true" /><span>Call</span></ContactLink> : null}
          <TrackedWhatsAppLink settings={settings} whatsappContext={{ pageTitle: "Header" }} context="header-whatsapp" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" className="inline-flex size-10 items-center justify-center rounded-full bg-whatsapp text-white shadow-soft hover:-translate-y-0.5"><WhatsAppIcon size={18} /></TrackedWhatsAppLink>
          <QuoteHeaderButton />
        </div>

        {phone ? <ContactLink href={phoneHref(phone)} eventType="CALL" context="header-phone-compact" className="ml-auto hidden min-h-10 items-center gap-2 rounded-control border border-line px-3 text-sm font-semibold text-ink-muted hover:border-accent hover:text-ink lg:inline-flex xl:hidden"><Phone size={15} aria-hidden="true" /><span>Call</span></ContactLink> : null}
        <QuoteHeaderButton className="hidden md:inline-flex xl:hidden px-3" />
        <button ref={menuButtonRef} type="button" className={cn("relative z-50 inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line text-ink hover:bg-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:hidden", styles.mobileToggle)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={23} aria-hidden="true" /> : <Menu size={23} aria-hidden="true" />}
        </button>
      </div>

      <div data-menu-open={menuOpen} className={cn("fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-dark px-5 pb-10 pt-24 text-white shadow-raised lg:hidden", styles.mobileDrawer, menuOpen ? "site-mobile-navigation-open block" : "hidden")}>
        <div ref={menuPanelRef} id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Main menu" className="mx-auto flex min-h-full max-w-2xl flex-col">
          <div className="mb-2 flex items-center gap-2 border-b border-white/10 pb-4">
            <BrandLogo width={36} height={36} className="size-9 shrink-0" />
            <span className="brand-wordmark text-base font-bold text-white">
              {settings.businessName.replace(/^M\/s\.\s*/, "")}
            </span>
          </div>
          <nav aria-label="Main" className="flex flex-col">
            {primaryNavigation.map((item, index) => <Link key={item.href} href={item.href} style={{ animationDelay: `${index * 45}ms` }} className="site-mobile-menu-link border-b border-white/10 py-4 font-heading text-2xl font-semibold text-white" onClick={() => setMenuOpen(false)}>{item.label}</Link>)}
            <MobileServicesAccordion services={services} onRoute={() => setMenuOpen(false)} />
          </nav>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {phone ? <ContactLink href={phoneHref(phone)} eventType="CALL" context="mobile-header-phone" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-white/20 px-4 font-semibold text-white"><Phone size={18} aria-hidden="true" />Call {phone.replace("+91", "")}</ContactLink> : null}
            <TrackedWhatsAppLink settings={settings} whatsappContext={{ pageTitle: "Mobile navigation" }} context="mobile-header-whatsapp" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-white/20 px-4 font-semibold text-white"><WhatsAppIcon size={18} />Chat on WhatsApp</TrackedWhatsAppLink>
            <Link href="/estimate" className="inline-flex min-h-12 items-center justify-center rounded-control bg-brand px-4 font-bold text-brand-ink sm:col-span-2" onClick={() => setMenuOpen(false)}>Get Free Quote</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
