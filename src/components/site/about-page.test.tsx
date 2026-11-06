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

  it("renders dynamic expertise section with three blocks", () => {
    const data = {
      ...emptyAboutPageData(),
      expertise: {
        eyebrow: "Our aim and values",
        title: "Genuine engineering solutions and repair expertise",
        description: "Dedicated civil engineering.",
        blocks: [
          { title: "Genuine engineering solutions", description: "Civil engineering services and solutions for corporate offices." },
          { title: "Repair-led expertise", description: "Repairs and rehabilitation of RCC structures." },
          { title: "Working in tandem", description: "Working in tandem with consultants and clients." },
        ],
      },
      expertiseVisible: true,
    };
    render(<AboutPage data={data} />);
    expect(screen.getByText("Genuine engineering solutions")).toBeTruthy();
    expect(screen.getByText("Repair-led expertise")).toBeTruthy();
    expect(screen.getByText("Working in tandem")).toBeTruthy();
  });

  it("hides expertise section when expertiseVisible is false", () => {
    const data = {
      ...emptyAboutPageData(),
      expertise: {
        eyebrow: "Our aim and values",
        title: "Genuine engineering solutions and repair expertise",
        description: "Dedicated civil engineering.",
        blocks: [
          { title: "Genuine engineering solutions", description: "Civil engineering services and solutions for corporate offices." },
        ],
      },
      expertiseVisible: false,
    };
    render(<AboutPage data={data} />);
    expect(screen.queryByText("Genuine engineering solutions")).toBeNull();
  });

  it("renders MSME with udyam logo and hides Workmen's Insurance when logo is not uploaded", () => {
    const data = {
      ...emptyAboutPageData(),
      credentialsData: {
        eyebrow: "Credentials",
        title: "Registered and responsibly covered",
        description: "Official statutory registrations.",
        items: [
          {
            id: "msme",
            label: "MSME registration",
            value: "Registered with MSME, Government of India",
            mediaId: null,
            mediaUrl: "/udyam.png",
            alt: "Udyam MSME Registration",
            isVisible: true,
            image: { url: "/udyam.png", alt: "Udyam MSME Registration", width: null, height: null },
          },
          {
            id: "workmen_insurance",
            label: "Workmen's compensation insurance",
            value: "Covered by workmen's compensation insurance policy",
            mediaId: null,
            mediaUrl: null,
            alt: "Workmen's Compensation Insurance",
            isVisible: true,
            image: null, // No approved logo uploaded yet
          },
        ],
      },
      credentialsVisible: true,
    };
    render(<AboutPage data={data} />);
    // MSME logo is visible
    const msmeLogo = screen.getByRole("img", { name: "Udyam MSME Registration" });
    expect(msmeLogo).toBeTruthy();
    expect(msmeLogo.getAttribute("src")).toBe("/udyam.png");

    // Workmen's insurance is NOT displayed because its approved logo is not uploaded yet
    expect(screen.queryByText("Workmen's compensation insurance")).toBeNull();
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

  it("renders dynamic expertise section with three blocks", () => {
    const data = {
      ...emptyAboutPageData(),
      expertise: {
        eyebrow: "Our aim and values",
        title: "Genuine engineering solutions and repair expertise",
        description: "Dedicated civil engineering.",
        blocks: [
          { title: "Genuine engineering solutions", description: "Civil engineering services and solutions for corporate offices." },
          { title: "Repair-led expertise", description: "Repairs and rehabilitation of RCC structures." },
          { title: "Working in tandem", description: "Working in tandem with consultants and clients." },
        ],
      },
      expertiseVisible: true,
    };
    render(<AboutPage data={data} />);
    expect(screen.getByText("Genuine engineering solutions")).toBeTruthy();
    expect(screen.getByText("Repair-led expertise")).toBeTruthy();
    expect(screen.getByText("Working in tandem")).toBeTruthy();
  });

  it("hides expertise section when expertiseVisible is false", () => {
    const data = {
      ...emptyAboutPageData(),
      expertise: {
        eyebrow: "Our aim and values",
        title: "Genuine engineering solutions and repair expertise",
        description: "Dedicated civil engineering.",
        blocks: [
          { title: "Genuine engineering solutions", description: "Civil engineering services and solutions for corporate offices." },
        ],
      },
      expertiseVisible: false,
    };
    render(<AboutPage data={data} />);
    expect(screen.queryByText("Genuine engineering solutions")).toBeNull();
  });

  it("renders MSME with udyam logo and hides Workmen's Insurance when logo is not uploaded", () => {
    const data = {
      ...emptyAboutPageData(),
      credentialsData: {
        eyebrow: "Credentials",
        title: "Registered and responsibly covered",
        description: "Official statutory registrations.",
        items: [
          {
            id: "msme",
            label: "MSME registration",
            value: "Registered with MSME, Government of India",
            mediaId: null,
            mediaUrl: "/udyam.png",
            alt: "Udyam MSME Registration",
            isVisible: true,
            image: { url: "/udyam.png", alt: "Udyam MSME Registration", width: null, height: null },
          },
          {
            id: "workmen_insurance",
            label: "Workmen's compensation insurance",
            value: "Covered by workmen's compensation insurance policy",
            mediaId: null,
            mediaUrl: null,
            alt: "Workmen's Compensation Insurance",
            isVisible: true,
            image: null, // No approved logo uploaded yet
          },
        ],
      },
      credentialsVisible: true,
    };
    render(<AboutPage data={data} />);
    // MSME logo is visible
    const msmeLogo = screen.getByRole("img", { name: "Udyam MSME Registration" });
    expect(msmeLogo).toBeTruthy();
    expect(msmeLogo.getAttribute("src")).toBe("/udyam.png");

    // Workmen's insurance is NOT displayed because its approved logo is not uploaded yet
    expect(screen.queryByText("Workmen's compensation insurance")).toBeNull();
  });
});
