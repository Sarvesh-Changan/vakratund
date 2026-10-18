"use client";

import { ChevronDown, Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ResolvedSiteSettings } from "@/config/site";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { ContactLink, TrackedWhatsAppLink } from "./contact-link";
import { phoneHref } from "./contact-utils";

export type HeaderService = { slug: string; title: string; shortDesc: string };

export function SiteHeader({ settings, services, overlayAtTop = false }: { settings: ResolvedSiteSettings; services: HeaderService[]; overlayAtTop?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const servicesMenuRef = useRef<HTMLDivElement>(null);
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
        if (current < 80 || menuOpen || servicesOpen) setHeaderVisible(true);
        else if (current - lastScrollY.current > 7) setHeaderVisible(false);
        else if (lastScrollY.current - current > 5) setHeaderVisible(true);
        lastScrollY.current = current;
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", update); };
  }, [menuOpen, servicesOpen]);

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

  useEffect(() => {
    if (!servicesOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setServicesOpen(false);
    };
    const closeOnOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !servicesMenuRef.current?.contains(event.target)) setServicesOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutside);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutside);
    };
  }, [servicesOpen]);

  const navLinkClass = "rounded-control px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-tint hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

  return (
    <header onFocusCapture={() => setHeaderVisible(true)} className={cn("fixed inset-x-3 top-3 z-50 mx-auto h-16 max-w-[1300px] rounded-pill border text-ink shadow-soft transition-[transform,height,box-shadow] duration-300 motion-reduce:transition-none", transparent ? "border-line bg-white/90 backdrop-blur-xl" : "border-line bg-white/95 shadow-raised backdrop-blur-xl", scrolled && "h-14", !headerVisible && !menuOpen && "-translate-y-[calc(100%+1rem)]")}>
      <div className="relative z-50 mx-auto flex h-full items-center justify-between gap-3 px-3 sm:px-5 lg:px-6">
        <Link href="/" onClick={() => { setMenuOpen(false); setServicesOpen(false); }} className="group flex min-h-11 shrink-0 items-center gap-2 rounded-control" aria-label={`${settings.businessName} home`}>
          <span className="flex size-9 items-center justify-center rounded-full bg-brand-signature text-sm font-bold text-white transition-transform group-hover:rotate-6" aria-hidden="true">V</span>
          <span className="max-w-[11rem] font-heading text-sm font-bold leading-tight tracking-tight sm:max-w-none sm:text-base">{settings.businessName.replace(/^M\/s\.\s*/, "")}</span>
        </Link>

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Primary navigation">
          <Link href="/" className={navLinkClass}>Home</Link>
          <Link href="/about" className={navLinkClass}>About</Link>
          <div ref={servicesMenuRef} className="relative">
            <button id="desktop-services-trigger" type="button" aria-expanded={servicesOpen} aria-controls="desktop-services-menu" onClick={() => setServicesOpen((open) => !open)} className={cn(navLinkClass, "inline-flex items-center gap-1")}>
              Services <ChevronDown size={15} aria-hidden="true" className={cn("transition-transform", servicesOpen && "rotate-180")} />
            </button>
            {servicesOpen ? <div id="desktop-services-menu" role="region" aria-labelledby="desktop-services-trigger" className="absolute left-1/2 top-full z-50 mt-3 w-[min(52rem,calc(100vw-2rem))] -translate-x-1/2 rounded-panel border border-line bg-surface p-5 text-ink shadow-raised">
              <div className="mb-4 flex items-end justify-between gap-3 border-b border-line pb-4"><div><p className="eyebrow">What we do</p><h2 className="mt-1 font-heading text-xl font-bold">Services built around your project</h2></div><Link href="/services" onClick={() => setServicesOpen(false)} className="shrink-0 text-sm font-semibold text-brand-deep hover:underline">All services</Link></div>
              <ul className="grid gap-1 sm:grid-cols-2">
                {services.map((service) => <li key={service.slug}><Link href={`/services/${service.slug}`} onClick={() => setServicesOpen(false)} className="group block rounded-control p-3 hover:bg-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-deep"><span className="font-semibold group-hover:text-brand-deep">{service.title}</span><span className="mt-1 line-clamp-2 block text-sm leading-6 text-ink-muted">{service.shortDesc}</span></Link></li>)}
              </ul>
            </div> : null}
          </div>
          <Link href="/projects" className={navLinkClass}>Projects</Link>
          <Link href="/contact" className={navLinkClass}>Contact</Link>
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          {phone ? <ContactLink href={phoneHref(phone)} eventType="CALL" context="header-phone" className="inline-flex min-h-10 items-center gap-2 rounded-control border border-line px-3 text-sm font-semibold text-ink-muted hover:border-accent hover:text-ink"><Phone size={15} aria-hidden="true" /><span>Call</span></ContactLink> : null}
          <TrackedWhatsAppLink settings={settings} whatsappContext={{ pageTitle: "Header" }} context="header-whatsapp" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" className="inline-flex size-10 items-center justify-center rounded-full bg-whatsapp text-white shadow-soft hover:-translate-y-0.5"><WhatsAppIcon size={18} /></TrackedWhatsAppLink>
          <Link href="/estimate" className="inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-control bg-accent px-4 text-sm font-bold text-accent-ink transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Get Free Quote</Link>
        </div>

        {phone ? <ContactLink href={phoneHref(phone)} eventType="CALL" context="header-phone-compact" className="ml-auto hidden min-h-10 items-center gap-2 rounded-control border border-line px-3 text-sm font-semibold text-ink-muted hover:border-accent hover:text-ink lg:inline-flex xl:hidden"><Phone size={15} aria-hidden="true" /><span>Call</span></ContactLink> : null}
        <Link href="/estimate" className="hidden min-h-10 items-center justify-center whitespace-nowrap rounded-control bg-accent px-3 text-sm font-bold text-accent-ink transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:inline-flex xl:hidden">Get Free Quote</Link>
        <button ref={menuButtonRef} type="button" className="relative z-50 inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line text-ink hover:bg-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent xl:hidden" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={23} aria-hidden="true" /> : <Menu size={23} aria-hidden="true" />}
        </button>
      </div>

      <div className={cn("fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-dark px-5 pb-10 pt-24 text-white shadow-raised xl:hidden", menuOpen ? "site-mobile-navigation-open block" : "hidden")}>
        <div ref={menuPanelRef} id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Main menu" className="mx-auto flex min-h-full max-w-2xl flex-col">
          <nav aria-label="Mobile navigation" className="flex flex-col">
            {[{ label: "Home", href: "/" }, { label: "About", href: "/about" }, { label: "Projects", href: "/projects" }, { label: "Contact", href: "/contact" }].map((item, index) => <Link key={item.href} href={item.href} style={{ animationDelay: `${index * 45}ms` }} className="site-mobile-menu-link border-b border-white/10 py-4 font-heading text-2xl font-semibold text-white" onClick={() => setMenuOpen(false)}>{item.label}</Link>)}
            <div className="site-mobile-menu-link border-b border-white/10 py-4" style={{ animationDelay: "225ms" }}>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-brand">Services</h2>
              <ul className="grid gap-x-6 sm:grid-cols-2">{services.map((service, index) => <li key={service.slug}><Link href={`/services/${service.slug}`} style={{ animationDelay: `${(index + 6) * 45}ms` }} className="site-mobile-menu-link block py-2 text-base font-medium text-white/85 hover:text-brand" onClick={() => setMenuOpen(false)}>{service.title}</Link></li>)}</ul>
              <Link href="/services" className="mt-2 inline-flex min-h-11 items-center font-semibold text-brand" onClick={() => setMenuOpen(false)}>Explore all services</Link>
            </div>
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
