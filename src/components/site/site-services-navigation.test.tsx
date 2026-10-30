import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DesktopServicesNavigation, MobileServicesAccordion } from "./site-services-navigation";

const pathname = vi.hoisted(() => ({ value: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));

const services = Array.from({ length: 11 }, (_, index) => ({
  slug: `service-${index + 1}`,
  title: `Service Title ${index + 1}`,
  shortDesc: `Private description ${index + 1}`,
  iconKey: "Building2",
  cover: null,
}));

function setMediaQueries({ finePointer, reducedMotion = false }: { finePointer: boolean; reducedMotion?: boolean }) {
  window.matchMedia = vi.fn((query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? reducedMotion : finePointer,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  })) as typeof window.matchMedia;
}

describe("desktop services menu", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pathname.value = "/";
    setMediaQueries({ finePointer: true });
  });
  afterEach(() => vi.useRealTimers());

  it("opens after hover intent and closes after leaving", async () => {
    render(<DesktopServicesNavigation services={services} navLinkClass="nav" />);
    const trigger = screen.getByRole("button", { name: "Open Services menu" });
    const root = trigger.parentElement?.parentElement;
    expect(root).toBeTruthy();
    fireEvent.pointerEnter(root!);
    await act(async () => { await vi.advanceTimersByTimeAsync(99); });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    fireEvent.pointerLeave(root!);
    await act(async () => { await vi.advanceTimersByTimeAsync(249); });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps the panel open while the pointer crosses the hover bridge", async () => {
    const { container } = render(<DesktopServicesNavigation services={services} navLinkClass="nav" />);
    const root = container.querySelector("[class]");
    const trigger = screen.getByRole("button", { name: "Open Services menu" });
    fireEvent.pointerEnter(root!);
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    const panel = screen.getByRole("region", { name: "Services" });
    fireEvent.pointerLeave(root!);
    fireEvent.pointerEnter(panel);
    await act(async () => { await vi.advanceTimersByTimeAsync(250); });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(panel.className).toContain("panelOpen");
  });

  it("supports arrow keys, Home, End and Escape focus return", async () => {
    render(<DesktopServicesNavigation services={services} navLinkClass="nav" />);
    const trigger = screen.getByRole("button", { name: "Open Services menu" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    await act(async () => { await vi.runAllTimersAsync(); });
    const panel = screen.getByRole("region", { name: "Services" });
    const links = within(panel).getAllByRole("link", { name: /Service Title/ });
    expect(document.activeElement).toBe(links[0]);
    fireEvent.keyDown(links[0]!, { key: "ArrowRight" });
    expect(document.activeElement).toBe(links[1]);
    fireEvent.keyDown(links[1]!, { key: "End" });
    expect(document.activeElement).toBe(links.at(-1));
    fireEvent.keyDown(links.at(-1)!, { key: "Escape" });
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("renders titles only and suppresses stagger under reduced motion", async () => {
    setMediaQueries({ finePointer: true, reducedMotion: true });
    const { container } = render(<DesktopServicesNavigation services={services} navLinkClass="nav" />);
    fireEvent.click(screen.getByRole("button", { name: "Open Services menu" }));
    await act(async () => { await vi.runAllTimersAsync(); });
    const panel = screen.getByRole("region", { name: "Services" });
    expect(within(panel).getAllByRole("link", { name: /Service Title/ })).toHaveLength(11);
    expect(panel.textContent).not.toContain("Private description");
    expect(panel.getAttribute("class")).toContain("reducedMotion");
    expect(container.querySelector("[data-service-menu-item]")?.getAttribute("style")).toBeNull();
  });
});

describe("mobile services accordion", () => {
  beforeEach(() => {
    setMediaQueries({ finePointer: false });
    pathname.value = "/";
  });

  it("opens as a single-column accordion without hover", () => {
    render(<MobileServicesAccordion services={services} />);
    const toggle = screen.getByRole("button", { name: "Toggle Services" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getAllByRole("link", { name: /Service Title/ })).toHaveLength(11);
    expect(screen.getByRole("link", { name: "Get a free quote" }).getAttribute("href")).toBe("/estimate");
  });
});
