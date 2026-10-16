import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MotionProvider } from "./motion-preference";
import { Reveal } from "./reveal";
import { SplitText } from "./split-text";

describe("motion accessibility and preferences", () => {
  beforeEach(() => {
    window.matchMedia = vi.fn((media) => ({ matches: false, media, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }));
  });

  it("keeps content visible when reduced motion is forced", () => {
    render(<MotionProvider forceReducedMotion><Reveal>Important content</Reveal></MotionProvider>);
    const reveal = screen.getByText("Important content");
    expect(reveal.textContent).toBe("Important content");
    expect(reveal.getAttribute("data-motion-enabled")).toBe("false");
  });

  it("exposes SplitText as a single accessible heading name", () => {
    render(<SplitText as="h2">Engineering built well</SplitText>);
    const heading = screen.getByRole("heading", { level: 2, name: "Engineering built well" });
    expect(heading.getAttribute("aria-label")).toBe("Engineering built well");
    expect(heading.getAttribute("data-split-mode")).toBe("words");
    expect(heading.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3);
  });
});
