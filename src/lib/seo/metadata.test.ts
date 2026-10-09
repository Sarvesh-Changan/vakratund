import { describe, expect, it } from "vitest";
import { buildMetadata } from "./metadata";

describe("buildMetadata", () => {
  it("merges PageSeo before entity fields and builds canonical/social metadata", () => {
    const metadata = buildMetadata({
      path: "/services/repairs",
      fallbackTitle: "Fallback title",
      fallbackDescription: "Fallback description",
      entitySeo: { seoTitle: "Entity title", seoDesc: "Entity description" },
      pageSeo: { seoTitle: "Page title", seoDesc: "Page description", canonical: "/repairs", noIndex: false, ogImage: { url: "/custom-og.png", alt: "Repair project" } },
      siteName: "M/s. Vakratund Construction",
      siteUrl: "https://example.com",
    });

    expect(metadata.title).toBe("Page title");
    expect(metadata.description).toBe("Page description");
    expect(metadata.alternates?.canonical).toBe("https://example.com/repairs");
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.openGraph).toMatchObject({ url: "https://example.com/repairs", siteName: "M/s. Vakratund Construction", title: "Page title" });
    expect(metadata.openGraph && "images" in metadata.openGraph ? metadata.openGraph.images : undefined).toEqual([{ url: "https://example.com/custom-og.png", alt: "Repair project" }]);
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image", title: "Page title" });
  });

  it("uses entity and fallback values and supports noindex", () => {
    const entityMetadata = buildMetadata({ path: "/about", fallbackTitle: "Fallback title", fallbackDescription: "Fallback description", entitySeo: { seoTitle: "Entity title", seoDesc: "Entity description" }, siteUrl: "https://example.com" });
    expect(entityMetadata.title).toBe("Entity title");
    expect(entityMetadata.description).toBe("Entity description");

    const fallbackMetadata = buildMetadata({ path: "/", fallbackTitle: "Fallback title", fallbackDescription: "Fallback description", noIndex: true, siteUrl: "https://example.com" });
    expect(fallbackMetadata.title).toBe("Fallback title");
    expect(fallbackMetadata.description).toBe("Fallback description");
    expect(fallbackMetadata.robots).toEqual({ index: false, follow: false });
    expect(fallbackMetadata.openGraph && "images" in fallbackMetadata.openGraph ? fallbackMetadata.openGraph.images : undefined).toEqual([{ url: "https://example.com/og-default.svg", alt: "Vakratund Construction" }]);
  });
});
