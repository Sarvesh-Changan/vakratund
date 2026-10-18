import { describe, expect, it } from "vitest";
import { fallbackSiteSettings } from "@/config/site";
import { buildBreadcrumbListJsonLd, buildCreativeWorkJsonLd, buildFaqPageJsonLd, buildGeneralContractorJsonLd, buildServiceJsonLd, serializeJsonLd, type JsonLdValue } from "./json-ld";

describe("JSON-LD builders", () => {
  it("builds LocalBusiness and GeneralContractor data from settings", () => {
    const data = buildGeneralContractorJsonLd({ ...fallbackSiteSettings, socials: [{ label: "Website", url: "https://example.com/social" }] }, "https://example.com");
    expect(data).toMatchObject({ "@context": "https://schema.org", "@type": ["LocalBusiness", "GeneralContractor"], name: "M/s. Vakratund Construction", telephone: ["+919821502956", "+919359895322"], foundingDate: "2003", sameAs: ["https://example.com/social"] });
    expect(data).toHaveProperty("areaServed", [{ "@type": "City", name: "Thane" }, { "@type": "City", name: "Mumbai" }]);
  });

  it("builds absolute breadcrumb items", () => {
    const data = buildBreadcrumbListJsonLd([{ name: "Home", item: "/" }, { name: "Services", item: "/services" }], "https://example.com");
    expect(data).toMatchObject({ "@type": "BreadcrumbList", itemListElement: [{ position: 1, name: "Home", item: "https://example.com/" }, { position: 2, name: "Services", item: "https://example.com/services" }] });
  });

  it("escapes HTML-sensitive characters before embedding JSON", () => {
    const serialized = serializeJsonLd({ name: "</script><script>alert('&')</script>" });
    expect(serialized).not.toContain("<");
    expect(serialized).not.toContain(">");
    expect(serialized).not.toContain("&");
    expect(serialized).toContain("\\u003c/script\\u003e");
  });

  it("builds Service data with provider and service areas", () => {
    const data = buildServiceJsonLd({ name: "Structural repair", description: "Repair scope", slug: "structural-repair", providerName: "Vakratund" }, "https://example.com");
    expect(data).toMatchObject({ "@type": "Service", url: "https://example.com/services/structural-repair", provider: { name: "Vakratund" }, areaServed: [{ name: "Thane" }, { name: "Mumbai" }] });
  });

  it("builds FAQPage data from published FAQs", () => {
    const data = buildFaqPageJsonLd([{ question: "What is included?", answer: "A site review." }]);
    expect(data).toMatchObject({ "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "What is included?", acceptedAnswer: { text: "A site review." } }] });
  });

  it("builds CreativeWork data without exposing an undisclosed client name", () => {
    const data = buildCreativeWorkJsonLd({ name: "Structural repair project", description: "Repair survey and execution.", slug: "structural-repair-project", location: "Thane, Maharashtra", serviceName: "Structural Repairs & Rehabilitation", clientName: null, year: 2026, creatorName: "M/s. Vakratund Construction" }, "https://example.com");
    expect(data).toMatchObject({ "@type": "CreativeWork", name: "Structural repair project", url: "https://example.com/projects/structural-repair-project", locationCreated: { name: "Thane, Maharashtra" } });
    expect(data).not.toHaveProperty("contributor");
  });

  it("parses every builder output and includes its required schema fields", () => {
    const builders: Array<{ type: string | string[]; data: JsonLdValue; required: string[] }> = [
      { type: ["LocalBusiness", "GeneralContractor"], data: buildGeneralContractorJsonLd(fallbackSiteSettings, "https://example.com"), required: ["@context", "@type", "name", "telephone", "address", "openingHours", "areaServed", "sameAs", "foundingDate"] },
      { type: "BreadcrumbList", data: buildBreadcrumbListJsonLd([{ name: "Home", item: "/" }], "https://example.com"), required: ["@context", "@type", "itemListElement"] },
      { type: "Service", data: buildServiceJsonLd({ name: "Repairs", description: "Repair work.", slug: "repairs", providerName: "Vakratund" }, "https://example.com"), required: ["@context", "@type", "name", "description", "url", "provider", "areaServed"] },
      { type: "FAQPage", data: buildFaqPageJsonLd([{ question: "Question?", answer: "Answer." }]), required: ["@context", "@type", "mainEntity"] },
      { type: "CreativeWork", data: buildCreativeWorkJsonLd({ name: "Project", description: "Description", slug: "project", creatorName: "Vakratund" }, "https://example.com"), required: ["@context", "@type", "name", "description", "url", "creator"] },
    ];

    for (const builder of builders) {
      const parsed: unknown = JSON.parse(serializeJsonLd(builder.data));
      if (Array.isArray(builder.type)) expect(parsed).toMatchObject({ "@type": builder.type });
      else expect(parsed).toMatchObject({ "@type": builder.type });
      expect(parsed).toEqual(expect.objectContaining(Object.fromEntries(builder.required.map((key) => [key, expect.anything()]))));
    }
  });
});
