import { describe, expect, it } from "vitest";

import { buildWhatsAppHref, buildWhatsAppShareHref } from "./whatsapp";

describe("buildWhatsAppHref", () => {
  it("uses the configured number and encodes the default message and context", () => {
    const href = buildWhatsAppHref(
      { whatsappNumber: "+91 98215 02956", whatsappMessage: "Hello & welcome" },
      { pageTitle: "Contact & quote", projectName: "Riverside <Tower>", estimateReference: "VK-ABC123" },
    );

    expect(href).toBe("https://wa.me/919821502956?text=Hello%20%26%20welcome%0APage%3A%20Contact%20%26%20quote%0AProject%3A%20Riverside%20%20Tower%0AEstimate%20reference%3A%20VK-ABC123");
  });

  it("falls back to the first phone and default text", () => {
    expect(buildWhatsAppHref({ phones: ["+91 90000 00000"], whatsappMessage: "" }, { pageTitle: "Home" })).toBe("https://wa.me/919000000000?text=Hello%2C%20I%20would%20like%20to%20discuss%20a%20project.%0APage%3A%20Home");
  });

  it("returns null when settings or a usable number is missing", () => {
    expect(buildWhatsAppHref(null)).toBeNull();
    expect(buildWhatsAppHref({ whatsappNumber: "", phones: [] })).toBeNull();
  });

  it("builds a safe share URL without a business number", () => {
    expect(buildWhatsAppShareHref("A project & a URL")).toBe("https://wa.me/?text=A%20project%20%26%20a%20URL");
  });
});
