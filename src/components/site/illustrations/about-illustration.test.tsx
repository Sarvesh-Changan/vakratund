import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AboutIllustration } from "./about-illustration";

let reducedMotion = false;

describe("AboutIllustration", () => {
  beforeEach(() => {
    reducedMotion = false;
    window.matchMedia = vi.fn((query: string) => ({ matches: query.includes("prefers-reduced-motion") && reducedMotion, media: query, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(() => false) })) as typeof window.matchMedia;
  });

  it("provides an accessible name and description when used as content", () => {
    render(<AboutIllustration />);
    expect(screen.getByRole("img", { name: "Illustration of a building under construction with a crane" })).toBeTruthy();
  });

  it("hides the image role when used decoratively", () => {
    const { container } = render(<AboutIllustration decorative />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("does not enable animation when reduced motion is requested", () => {
    reducedMotion = true;
    const { container } = render(<AboutIllustration />);
    expect(container.querySelector("svg")?.getAttribute("data-motion-state")).toBe("static");
  });

  it("keeps the source small, original, inline, and token-colored", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/site/illustrations/about-illustration.tsx"), "utf8");
    const styles = readFileSync(resolve(process.cwd(), "src/components/site/illustrations/illustration-canvas.module.css"), "utf8");
    expect(Buffer.byteLength(source, "utf8")).toBeLessThan(8_192);
    expect(source).not.toMatch(/#[\da-f]{3,8}\b/i);
    expect(source).not.toMatch(/<script\b|<foreignObject\b/i);
    expect(source).not.toMatch(/https?:\/\//i);
    expect(styles).not.toMatch(/#[\da-f]{3,8}\b/i);
    expect(styles).toContain("var(--tint)");
    expect(styles).toContain("var(--accent-2)");
  });
});

