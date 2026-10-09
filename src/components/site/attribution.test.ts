import { beforeEach, describe, expect, it } from "vitest";
import { captureFirstPartyAttribution, getLeadTracking } from "./attribution";

describe("first-party attribution", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/contact?utm_source=google&utm_campaign=repair");
    Object.defineProperty(document, "referrer", { configurable: true, value: "https://example.com/landing" });
  });

  it("stores the first landing referrer and UTM values", () => {
    captureFirstPartyAttribution();
    window.history.replaceState({}, "", "/contact");
    expect(getLeadTracking("/contact")).toMatchObject({ sourcePage: "/contact", referrer: "https://example.com/landing", utmSource: "google", utmCampaign: "repair" });
  });

  it("does not overwrite the original attribution on later landings", () => {
    captureFirstPartyAttribution();
    window.history.replaceState({}, "", "/estimate?utm_source=other");
    captureFirstPartyAttribution();
    expect(getLeadTracking("/estimate").utmSource).toBe("google");
  });
});
