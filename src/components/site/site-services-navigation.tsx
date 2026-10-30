"use client";

import { ArrowRight, ChevronDown, Phone } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";

import { ServiceIcon } from "@/components/site/service-icon";
import { cn } from "@/lib/utils";
import type { HeaderService } from "./site-header";
import { ContactLink } from "./contact-link";
import { phoneHref } from "./contact-utils";
import styles from "./site-services-navigation.module.css";

type ServicesNavigationProps = { services: HeaderService[]; phone?: string; navLinkClass: string; closeToken?: number; onRoute?: () => void };

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

function ServiceLinks({ services, mobile = false, onRoute, reducedMotion = false }: { services: HeaderService[]; mobile?: boolean; onRoute?: () => void; reducedMotion?: boolean }) {
  const pathname = usePathname();
  return <ul className={cn(mobile ? styles.mobileItems : styles.items)} style={!mobile ? ({ "--rows-lg": Math.max(1, Math.ceil(services.length / 2)), "--rows-xl": Math.max(1, Math.ceil(services.length / 3)) } as CSSProperties) : undefined}>
    {services.map((service, index) => {
      const active = pathname === `/services/${service.slug}`;
      return <li key={service.slug} style={!mobile && !reducedMotion ? ({ "--item-delay": `${Math.min(index * 20, 240)}ms` } as CSSProperties) : undefined}>
        <Link href={`/services/${service.slug}`} data-service-menu-item="true" onClick={onRoute} title={service.title.length > 28 ? service.title : undefined} aria-current={active ? "page" : undefined} className={cn(styles.serviceLink, active && styles.serviceLinkActive)}>
          <span className={styles.iconTile} aria-hidden="true"><ServiceIcon iconKey={service.iconKey} size={17} /></span>
          <span className={styles.serviceTitle}>{service.title}</span>
          <ArrowRight className={styles.arrow} size={15} aria-hidden="true" />
        </Link>
      </li>;
    })}
  </ul>;
}

export function DesktopServicesNavigation({ services, phone, navLinkClass, closeToken = 0 }: ServicesNavigationProps) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openedAtScroll = useRef(0);
  const previousPathname = useRef(pathname);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [finePointer, setFinePointer] = useState(false);

  const clearTimers = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (blurTimer.current) clearTimeout(blurTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
    blurTimer.current = null;
  }, []);

  const close = useCallback(() => {
    clearTimers();
    setOpen(false);
    closeTimer.current = setTimeout(() => setMounted(false), reducedMotion ? 0 : 125);
  }, [clearTimers, reducedMotion]);

  const show = useCallback(() => {
    clearTimers();
    openedAtScroll.current = window.scrollY;
    setMounted(true);
    setOpen(true);
  }, [clearTimers]);

  const scheduleOpen = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!finePointer || event.pointerType === "touch") return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = setTimeout(show, reducedMotion ? 0 : 100);
  }, [finePointer, reducedMotion, show]);

  const scheduleClose = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!finePointer || event.pointerType === "touch") return;
    if (openTimer.current) clearTimeout(openTimer.current);
    closeTimer.current = setTimeout(close, reducedMotion ? 0 : 250);
  }, [close, finePointer, reducedMotion]);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFinePointer(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    const timer = window.setTimeout(close, 0);
    return () => window.clearTimeout(timer);
  }, [close, pathname]);

  useEffect(() => {
    if (closeToken === 0) return;
    const timer = window.setTimeout(close, 0);
    return () => window.clearTimeout(timer);
  }, [closeToken, close]);

  useEffect(() => {
    if (!open) return;
    const outsideClick = (event: globalThis.PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) close();
    };
    const scroll = () => {
      if (Math.abs(window.scrollY - openedAtScroll.current) > 40) close();
    };
    document.addEventListener("pointerdown", outsideClick);
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", outsideClick);
      window.removeEventListener("scroll", scroll);
    };
  }, [close, open]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  function focusItem(index: number) {
    const items = rootRef.current?.querySelectorAll<HTMLAnchorElement>("[data-service-menu-item]");
    if (!items?.length) return;
    items[(index + items.length) % items.length]?.focus();
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      show();
      requestAnimationFrame(() => focusItem(event.key === "ArrowDown" ? 0 : services.length - 1));
    }
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      triggerRef.current?.focus();
      return;
    }
    const keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"];
    if (keys.includes(event.key)) {
      const links = [...(rootRef.current?.querySelectorAll<HTMLAnchorElement>("[data-service-menu-item]") ?? [])];
      const current = links.indexOf(document.activeElement as HTMLAnchorElement);
      if (current < 0) return;
      event.preventDefault();
      const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
      focusItem(current + (forward ? 1 : -1));
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      focusItem(event.key === "Home" ? 0 : services.length - 1);
    }
  }

  function onBlurCapture() {
    blurTimer.current = setTimeout(() => {
      if (!rootRef.current?.contains(document.activeElement)) close();
    }, 0);
  }

  const active = services.some((service) => pathname === `/services/${service.slug}`);
  const panelClass = cn(styles.panel, open && styles.panelOpen, reducedMotion && styles.reducedMotion);

  return <div ref={rootRef} className={styles.desktopRoot} onPointerEnter={scheduleOpen} onPointerLeave={scheduleClose} onBlurCapture={onBlurCapture} onKeyDown={onMenuKeyDown}>
    <div className="flex items-center gap-0.5">
      <Link href="/services" className={navLinkClass}>Services</Link>
      <button ref={triggerRef} id="desktop-services-trigger" type="button" aria-label="Open Services menu" aria-expanded={open} aria-controls="desktop-services-menu" onClick={() => open ? close() : show()} onKeyDown={onTriggerKeyDown} className={cn(navLinkClass, "-ml-2 inline-flex size-9 items-center justify-center rounded-full px-0", active && "text-brand-deep")}>
        <ChevronDown size={15} aria-hidden="true" className={cn("transition-transform duration-200 motion-reduce:transition-none motion-reduce:rotate-0", open && "rotate-180")} />
      </button>
    </div>
    {mounted ? <div id="desktop-services-menu" role="region" aria-label="Services" aria-hidden={!open} inert={!open} className={panelClass}>
      <div className={styles.panelHeader}><p className={styles.eyebrow}>OUR SERVICES</p><Link href="/services" onClick={close} className={styles.allServices}>View all services <ArrowRight size={15} aria-hidden="true" /></Link></div>
      <ServiceLinks services={services} reducedMotion={reducedMotion} onRoute={close} />
      <div className={styles.panelFooter}><Link href="/estimate" onClick={close} className={styles.quoteLink}>Not sure what you need? Get a free quote <ArrowRight size={15} aria-hidden="true" /></Link>{phone ? <ContactLink href={phoneHref(phone)} eventType="CALL" context="services-menu-call" className={styles.callLink}><Phone size={15} aria-hidden="true" /> Call</ContactLink> : null}</div>
    </div> : null}
  </div>;
}

export function MobileServicesAccordion({ services, onRoute }: Pick<ServicesNavigationProps, "services" | "onRoute">) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const previousPathname = useRef(pathname);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    const timer = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);
  return <section className="border-b border-white/10 py-2" aria-label="Services">
    <div className="flex items-center justify-between">
      <Link href="/services" className="site-mobile-menu-link py-3 font-heading text-2xl font-semibold text-white" onClick={onRoute}>Services</Link>
      <button type="button" className={styles.accordionTrigger} aria-label="Toggle Services" aria-expanded={open} aria-controls="mobile-services-accordion" onClick={() => setOpen((value) => !value)}><ChevronDown size={20} aria-hidden="true" /></button>
    </div>
    <div id="mobile-services-accordion" aria-hidden={!open} inert={!open} className={cn(styles.accordion, open && styles.accordionOpen)} data-reduced-motion={reducedMotion}>
      <div className={styles.accordionInner}>
        <ServiceLinks services={services} mobile onRoute={onRoute} />
        <div className="flex flex-wrap items-center gap-2 pb-2"><Link href="/services" onClick={onRoute} className={styles.mobileAllServices}>View all services <ArrowRight size={15} aria-hidden="true" /></Link><Link href="/estimate" onClick={onRoute} className={styles.mobileQuote}>Get a free quote <ArrowRight size={15} aria-hidden="true" /></Link></div>
      </div>
    </div>
  </section>;
}
