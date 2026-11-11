import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fallbackSiteSettings } from "@/config/site";
import { SiteHeader } from "./site-header";

const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("next/link", () => ({ default: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props} /> }));

describe("SiteHeader mobile drawer", () => {
  beforeEach(() => {
    route.pathname = "/";
    window.matchMedia = vi.fn((query: string) => ({
      matches: query.includes("hover: hover") ? false : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    })) as typeof window.matchMedia;
    window.scrollTo = vi.fn();
  });
  afterEach(() => { document.body.style.position = ""; document.body.style.top = ""; document.body.style.width = ""; document.body.style.paddingRight = ""; });

  it("toggles expanded state, locks/restores scrolling, and returns focus on Escape", async () => {
    render(<SiteHeader settings={fallbackSiteSettings} services={[]} />);
    const toggle = screen.getByRole("button", { name: "Open menu" });
    await act(async () => { fireEvent.click(toggle); });
    expect(document.querySelector<HTMLButtonElement>('button[aria-controls="mobile-navigation"]')?.getAttribute("aria-expanded")).toBe("true");
    expect(document.body.style.position).toBe("fixed");
    await act(async () => { fireEvent.keyDown(document, { key: "Escape" }); });
    expect(document.body.style.position).toBe("");
    expect(screen.getByRole("button", { name: "Open menu" }).getAttribute("aria-expanded")).toBe("false");
    await waitFor(() => expect(document.activeElement).toBe(toggle));
  });

  it("closes on route changes and when the viewport grows to desktop", async () => {
    const view = render(<SiteHeader settings={fallbackSiteSettings} services={[]} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Open menu" })); });
    route.pathname = "/about";
    view.rerender(<SiteHeader settings={fallbackSiteSettings} services={[]} />);
    expect(screen.queryByRole("dialog", { name: "Main menu" })).toBeNull();

    route.pathname = "/";
    view.rerender(<SiteHeader settings={fallbackSiteSettings} services={[]} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Open menu" })); });
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
    await act(async () => { fireEvent(window, new Event("resize")); });
    expect(screen.queryByRole("dialog", { name: "Main menu" })).toBeNull();
  });
});
