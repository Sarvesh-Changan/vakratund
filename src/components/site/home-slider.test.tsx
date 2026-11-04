import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HomeSlider } from "@/components/site/home-slider";
import type { PublicHomeSlide } from "@/server/queries/home-slides";

// Mock CloudImage
vi.mock("@/components/media/cloud-image", () => ({
  CloudImage: ({ alt, publicId }: { alt: string; publicId: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`https://res.cloudinary.com/test/${publicId}`} alt={alt} data-testid="cloud-image" />
  ),
}));

// Mock Marquee
vi.mock("@/components/motion/marquee", () => ({
  Marquee: ({
    children,
    speed,
    direction,
    className,
  }: {
    children: React.ReactNode;
    speed?: number;
    direction?: string;
    className?: string;
  }) => (
    <div data-testid="marquee-wrapper" data-speed={speed} data-direction={direction} className={className}>
      {children}
    </div>
  ),
}));

const makeSlide = (i: number, overrides = {}): PublicHomeSlide => ({
  id: `slide-${i}`,
  alt: `Construction site image ${i}`,
  title: i % 2 === 0 ? `Title ${i}` : null,
  caption: null,
  linkUrl: i === 1 ? "/services/civil" : null,
  sortOrder: i,
  media: {
    url: `https://res.cloudinary.com/test/image/upload/v1/vakratund/home/photo_${i}.jpg`,
    alt: `Alt ${i}`,
    width: 800,
    height: 600,
    format: "jpg",
  },
  ...overrides,
});

describe("HomeSlider public component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders null and hides section when fewer than 4 slides are available", () => {
    const slides = [makeSlide(1), makeSlide(2), makeSlide(3)];
    const { container } = render(<HomeSlider slides={slides} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a static responsive grid (no marquee) when there are 4 to 6 slides", () => {
    const slides = [makeSlide(1), makeSlide(2), makeSlide(3), makeSlide(4), makeSlide(5)];
    render(<HomeSlider slides={slides} />);

    // No marquee rendered
    expect(screen.queryByTestId("marquee-wrapper")).toBeNull();

    // Renders grid
    const images = screen.getAllByTestId("cloud-image");
    expect(images.length).toBe(5);
  });

  it("renders Marquee with correct speed setting when there are 7 or more slides", () => {
    const slides = Array.from({ length: 8 }, (_, i) => makeSlide(i + 1));
    render(<HomeSlider slides={slides} showcase={{ speed: "fast", pauseOnHover: true }} />);

    const marquees = screen.getAllByTestId("marquee-wrapper");
    expect(marquees.length).toBeGreaterThanOrEqual(1);
    expect(marquees[0]?.getAttribute("data-speed")).toBe("80");
  });

  it("maps speed tokens correctly: slow=30, normal=50, fast=80", () => {
    const slides = Array.from({ length: 7 }, (_, i) => makeSlide(i + 1));

    const { rerender } = render(<HomeSlider slides={slides} showcase={{ speed: "slow", pauseOnHover: true }} />);
    expect(screen.getByTestId("marquee-wrapper").getAttribute("data-speed")).toBe("30");

    rerender(<HomeSlider slides={slides} showcase={{ speed: "normal", pauseOnHover: true }} />);
    expect(screen.getByTestId("marquee-wrapper").getAttribute("data-speed")).toBe("50");

    rerender(<HomeSlider slides={slides} showcase={{ speed: "fast", pauseOnHover: true }} />);
    expect(screen.getByTestId("marquee-wrapper").getAttribute("data-speed")).toBe("80");
  });

  it("renders dual rows (second row opposite direction) when 10 or more slides on desktop", () => {
    const slides = Array.from({ length: 10 }, (_, i) => makeSlide(i + 1));
    render(<HomeSlider slides={slides} />);

    const marquees = screen.getAllByTestId("marquee-wrapper");
    // Should have primary row and desktop reverse row
    expect(marquees.length).toBe(2);
    expect(marquees[0]?.getAttribute("data-direction")).toBe("left");
    expect(marquees[1]?.getAttribute("data-direction")).toBe("right");
  });

  it("renders link when linkUrl is set and decorative/caption when not", () => {
    const slides = Array.from({ length: 7 }, (_, i) => makeSlide(i + 1));
    render(<HomeSlider slides={slides} />);

    // Slide 1 has linkUrl: "/services/civil"
    const link = screen.getByRole("link", { name: /Construction site image 1/i });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/services/civil");
  });

  it("renders optional eyebrow and heading only when provided", () => {
    const slides = Array.from({ length: 7 }, (_, i) => makeSlide(i + 1));
    const { rerender } = render(<HomeSlider slides={slides} />);
    expect(screen.queryByRole("heading")).toBeNull();

    rerender(
      <HomeSlider
        slides={slides}
        showcase={{ eyebrow: "Field Showcase", heading: "Project Highlights", speed: "normal", pauseOnHover: true }}
      />,
    );
    expect(screen.getByText("Field Showcase")).toBeDefined();
    expect(screen.getByRole("heading", { level: 2, name: "Project Highlights" })).toBeDefined();
  });
});

