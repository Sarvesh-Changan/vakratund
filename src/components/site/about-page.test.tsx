import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({ prisma: {} }));
vi.mock("@/components/cloud-image", () => ({ CloudImage: ({ src, alt }: { src: string; alt: string }) => <div role="img" aria-label={alt} data-src={src} /> }));
import { AboutPage } from "@/components/site/about-page";
import { emptyAboutPageData } from "@/server/queries/about";

describe("public About story image", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })) });
  });
  it("shows the blueprint fallback and Since badge when no image is set", () => {
    const data = { ...emptyAboutPageData(), story: { title: "Our story", body: "Vakratund Construction was established in 2003." } };
    const { container } = render(<AboutPage data={data} />);
    expect(container.querySelector(".home-blueprint-pattern")).not.toBeNull();
    expect(screen.getByText("Since")).toBeTruthy();
  });

  it("shows the configured story image when set", () => {
    const data = { ...emptyAboutPageData(), story: { title: "Our story", body: "Vakratund Construction was established in 2003.", imageMediaId: "cmj4media00000000000000001", imageAlt: "Vakratund construction team", image: { url: "https://res.cloudinary.com/example/image/upload/v1/story.jpg", alt: "Vakratund construction team", width: 1200, height: 900 } } };
    render(<AboutPage data={data} />);
    expect(screen.getByRole("img", { name: "Vakratund construction team" })).toBeTruthy();
    expect(screen.getByText("Since")).toBeTruthy();
  });
});
