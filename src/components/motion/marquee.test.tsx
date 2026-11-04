import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Marquee } from "./marquee";
import { MotionProvider } from "./motion-preference";

describe("Marquee Component", () => {
  let resizeCallbacks: Array<(entries: unknown[]) => void> = [];

  beforeEach(() => {
    resizeCallbacks = [];
    vi.useFakeTimers();

    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    global.ResizeObserver = class {
      callback: (entries: unknown[]) => void;
      constructor(callback: (entries: unknown[]) => void) {
        this.callback = callback;
        resizeCallbacks.push(callback);
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    } as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("calculates duration as contentWidth / speed, independent of duplicate set", () => {
    const originalScrollWidth = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollWidth"
    );
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
      configurable: true,
      get() {
        return 800;
      },
    });

    try {
      const { container } = render(
        <Marquee label="Credibility chips" speed={40}>
          <span>Chip 1</span>
          <span>Chip 2</span>
        </Marquee>
      );

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const track = container.querySelector(".motion-marquee-track") as HTMLElement;
      expect(track).toBeDefined();

      // speed = 40, width = 800 -> duration = 800 / 40 = 20s
      const durationStyle = track.style.getPropertyValue("--marquee-duration");
      expect(durationStyle).toBe("20s");
    } finally {
      if (originalScrollWidth) {
        Object.defineProperty(HTMLElement.prototype, "scrollWidth", originalScrollWidth);
      }
    }
  });

  it("renders duplicate set with aria-hidden and inert", () => {
    const { container } = render(
      <Marquee label="Credibility chips" speed={40}>
        <span>Chip A</span>
      </Marquee>
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    const sets = container.querySelectorAll(".motion-marquee-set");
    expect(sets.length).toBe(2);

    const primarySet = sets[0];
    const duplicateSet = sets[1];

    expect(primarySet).toBeDefined();
    expect(duplicateSet).toBeDefined();
    if (!primarySet || !duplicateSet) throw new Error("Expected marquee sets to exist");

    expect(primarySet.getAttribute("aria-hidden")).toBeNull();
    expect(primarySet.hasAttribute("inert")).toBe(false);

    expect(duplicateSet.getAttribute("aria-hidden")).toBe("true");
    expect(duplicateSet.hasAttribute("inert")).toBe(true);
  });

  it("toggles pause state and updates accessible label via pause button", () => {
    render(
      <Marquee label="Credibility chips" speed={40} showPauseButton>
        <span>Chip A</span>
      </Marquee>
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    const pauseButton = screen.getByRole("button", { name: "Pause Credibility chips" });
    expect(pauseButton).toBeDefined();
    expect(pauseButton.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(pauseButton);
    expect(pauseButton.getAttribute("aria-label")).toBe("Play Credibility chips");
    expect(pauseButton.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(pauseButton);
    expect(pauseButton.getAttribute("aria-label")).toBe("Pause Credibility chips");
    expect(pauseButton.getAttribute("aria-pressed")).toBe("false");
  });

  it("renders a static row and omits duplicate set under reduced motion", () => {
    const { container } = render(
      <MotionProvider forceReducedMotion>
        <Marquee label="Credibility chips" speed={40}>
          <span>Chip Static</span>
        </Marquee>
      </MotionProvider>
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    const sets = container.querySelectorAll(".motion-marquee-set");
    expect(sets.length).toBe(1);

    const track = container.querySelector(".motion-marquee-track");
    expect(track?.classList.contains("motion-marquee-static")).toBe(true);
  });

  it("preserves progress on resize with ResizeObserver without visual jump", () => {
    let mockWidth = 600;
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
      configurable: true,
      get() {
        return mockWidth;
      },
    });

    const { container } = render(
      <Marquee label="Credibility chips" speed={40}>
        <span>Dynamic Content</span>
      </Marquee>
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    const track = container.querySelector(".motion-marquee-track") as HTMLElement;
    expect(track.style.getPropertyValue("--marquee-duration")).toBe("15s");

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    mockWidth = 1200;
    act(() => {
      for (const cb of resizeCallbacks) {
        cb([]);
      }
      vi.advanceTimersByTime(150);
    });

    expect(track.style.getPropertyValue("--marquee-duration")).toBe("30s");

    const delayStr = track.style.getPropertyValue("--marquee-delay");
    expect(delayStr).toMatch(/^-10(\.\d+)?s$/);
  });
});
