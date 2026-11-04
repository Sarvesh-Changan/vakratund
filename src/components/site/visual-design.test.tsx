import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomeHero } from "./home-hero";
import { SiteHeader } from "./site-header";
import type { ResolvedSiteSettings } from "@/config/site";
import type { HomeHero as HomeHeroContent } from "@/server/queries/home";

// WCAG relative luminance & contrast calculation helper
function calculateRelativeLuminance(hex: string): number {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
  const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
  const b = parseInt(cleanHex.slice(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return (
    0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  );
}

function calculateContrastRatio(hex1: string, hex2: string): number {
  const l1 = calculateRelativeLuminance(hex1);
  const l2 = calculateRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Visual Design & Tokens Verification", () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  const mockSettings: ResolvedSiteSettings = {
    businessName: "M/s. Vakratund Construction",
    tagline: "Quality is our first priority",
    phones: ["+919820000000"],
    whatsappNumber: "+919820000000",
    email: "info@vakratund.com",
    address: "Thane, Maharashtra",
    foundedYear: 2003,
    credentials: [],
    whatsappMessage: "Hello",
    responseTimeText: "Within 2 hours",
    mapEmbedUrl: "",
    businessHours: {
      monday: { closed: false, open: "09:00", close: "18:00" },
      tuesday: { closed: false, open: "09:00", close: "18:00" },
      wednesday: { closed: false, open: "09:00", close: "18:00" },
      thursday: { closed: false, open: "09:00", close: "18:00" },
      friday: { closed: false, open: "09:00", close: "18:00" },
      saturday: { closed: false, open: "09:00", close: "18:00" },
      sunday: { closed: true, open: "09:00", close: "18:00" },
    },
    socials: [],
  };

  const mockHero: HomeHeroContent = {
    eyebrow: "Project Management Consultant & Turnkey Developers",
    title: "Building trust since 2003",
    description: "Civil engineering services for project management and repairs.",
    primaryCta: "Get Free Quote",
    primaryHref: "/estimate",
    secondaryCta: "Call Now",
    secondaryHref: "tel:+919820000000",
    backgroundImageId: null,
  };

  it("applies brand-wordmark class to the header wordmark text", () => {
    const { container } = render(
      <SiteHeader settings={mockSettings} services={[]} />
    );

    const wordmarkElements = container.querySelectorAll(".brand-wordmark");
    expect(wordmarkElements.length).toBeGreaterThan(0);
    expect(wordmarkElements[0]?.textContent).toBe("Vakratund Construction");
  });

  it("applies hero-bg background and correct button styles in HomeHero", () => {
    const { container } = render(<HomeHero hero={mockHero} />);

    const heroSection = container.querySelector("section");
    expect(heroSection?.className).toContain("bg-hero-bg");
    expect(heroSection?.className).toContain("text-hero-ink");

    // Primary button has bg-hero-ink
    const primaryButton = screen.getByRole("link", { name: /get free quote/i });
    expect(primaryButton.className).toContain("bg-hero-ink");
    expect(primaryButton.className).toContain("text-white");

    // Secondary button has outlined style with hero-ink
    const secondaryButton = screen.getByRole("link", { name: /call now/i });
    expect(secondaryButton.className).toContain("border-hero-ink");
    expect(secondaryButton.className).toContain("text-hero-ink");
  });

  it("verifies WCAG AA contrast for hero tokens and buttons", () => {
    const heroBg = "#FBDDBB";
    const heroInk = "#232429";
    const heroInkMuted = "#5D534A";
    const buttonWhite = "#FFFFFF";

    // 1. Headline & primary text on hero background (Must be >= 4.5:1 for normal, >= 3:1 for large)
    const textContrast = calculateContrastRatio(heroInk, heroBg);
    expect(textContrast).toBeGreaterThanOrEqual(7.0); // Passes AAA (actual ~11.9:1)

    // 2. Muted sub-text and eyebrow on hero background (Must be >= 4.5:1 for normal)
    const mutedContrast = calculateContrastRatio(heroInkMuted, heroBg);
    expect(mutedContrast).toBeGreaterThanOrEqual(4.5); // Passes AA (actual ~5.7:1)

    // 3. Primary dark button text (white on hero-ink)
    const buttonContrast = calculateContrastRatio(buttonWhite, heroInk);
    expect(buttonContrast).toBeGreaterThanOrEqual(7.0); // Passes AAA (actual ~15.5:1)

    // 4. Secondary button text (hero-ink on hero-bg)
    const secondaryContrast = calculateContrastRatio(heroInk, heroBg);
    expect(secondaryContrast).toBeGreaterThanOrEqual(4.5); // Passes AA
  });
});
