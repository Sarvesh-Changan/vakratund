import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QuoteHeaderButton } from "./quote-header-button";

describe("QuoteHeaderButton inactivity alert", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the Get Free Quote button with link to /estimate", () => {
    render(<QuoteHeaderButton />);
    const link = screen.getByRole("link", { name: /get free quote/i });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/estimate");
    // Initially not blinking
    expect(link.className).not.toContain("animate-quote-blink");
  });

  it("blinks with radiating yellow lines after 10 seconds of user inactivity", () => {
    const { container } = render(<QuoteHeaderButton />);
    const link = screen.getByRole("link", { name: /get free quote/i });

    expect(link.className).not.toContain("animate-quote-blink");
    expect(container.querySelector("svg.animate-quote-rays")).toBeNull();

    // Advance by 10 seconds of inactivity
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Now blinking and radiating yellow lines SVG is displayed
    expect(link.className).toContain("animate-quote-blink");
    const raysSvg = container.querySelector("svg.animate-quote-rays");
    expect(raysSvg).not.toBeNull();
    const lines = raysSvg?.querySelectorAll("line");
    expect(lines?.length).toBeGreaterThan(0);

    // Continues blinking after 20 seconds if user remains inactive
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(link.className).toContain("animate-quote-blink");
  });

  it("resets and cancels blinking upon user interaction", () => {
    render(<QuoteHeaderButton />);
    const link = screen.getByRole("link", { name: /get free quote/i });

    // Advance 10s into inactivity -> starts blinking
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(link.className).toContain("animate-quote-blink");

    // User moves mouse or scrolls -> stops blinking immediately
    act(() => {
      fireEvent.mouseMove(window);
    });
    expect(link.className).not.toContain("animate-quote-blink");
  });
});
