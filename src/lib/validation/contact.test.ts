import { describe, expect, it } from "vitest";
import { contactSchema, sanitizeProjectPrefill } from "./contact";

describe("contact validation", () => {
  const valid = { name: "Asha Shah", phone: "+919821502956", email: "", location: "Thane", message: "Please call me.", website: "", consent: true };

  it("accepts a valid Indian contact form", () => expect(contactSchema.safeParse(valid).success).toBe(true));
  it("requires +91 phone format and consent", () => {
    expect(contactSchema.safeParse({ ...valid, phone: "9821502956" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
  });
  it("sanitizes and caps project prefill values", () => expect(sanitizeProjectPrefill("  Society <audit>   project  ".repeat(10))).toHaveLength(120));
});
