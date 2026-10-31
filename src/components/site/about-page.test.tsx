import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({ prisma: {} }));
/* eslint-disable @next/next/no-img-element -- the mock needs a real image error event. */
vi.mock("@/components/cloud-image", () => ({ CloudImage: ({ src, alt, onError, className }: { src: string; alt: string; onError?: React.ReactEventHandler<HTMLImageElement>; className?: string }) => <img src={src} alt={alt} onError={onError} className={className} data-src={src} /> }));
/* eslint-enable @next/next/no-img-element */
import { AboutPage } from "@/components/site/about-page";
import { emptyAboutPageData } from "@/server/queries/about";

describe("public About story image", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })) });
  });
  it("shows the blueprint fallback and Since badge when no image is set", () => {
    const data = { ...emptyAboutPageData(), story: { title: "Our story", body: "Vakratund Construction was established in 2003." } };
    render(<AboutPage data={data} />);
    expect(screen.getByRole("img", { name: "Illustration of a building under construction with a crane" })).toBeTruthy();
    expect(screen.getByText("Since")).toBeTruthy();
  });

  it("shows the configured story image when set", () => {
    const data = { ...emptyAboutPageData(), story: { title: "Our story", body: "Vakratund Construction was established in 2003.", imageMediaId: "cmj4media00000000000000001", imageAlt: "Vakratund construction team", image: { url: "https://res.cloudinary.com/example/image/upload/v1/story.jpg", alt: "Vakratund construction team", width: 1200, height: 900 } } };
    render(<AboutPage data={data} />);
    expect(screen.getByRole("img", { name: "Vakratund construction team" })).toBeTruthy();
    expect(screen.getByText("Since")).toBeTruthy();
  });

  it("falls back to the illustration if the configured image fails to load", () => {
    const data = { ...emptyAboutPageData(), story: { title: "Our story", body: "Vakratund Construction was established in 2003.", imageMediaId: "cmj4media00000000000000001", imageAlt: "Vakratund construction team", image: { url: "https://res.cloudinary.com/example/image/upload/v1/story.jpg", alt: "Vakratund construction team", width: 1200, height: 900 } } };
    render(<AboutPage data={data} />);
    fireEvent.error(screen.getByRole("img", { name: "Vakratund construction team" }));
    expect(screen.getByRole("img", { name: "Illustration of a building under construction with a crane" })).toBeTruthy();
    expect(screen.getByText("Since")).toBeTruthy();
  });
});
