import { describe, expect, it } from "vitest";
import { brochureSubmissionSchema, contactLeadSubmissionSchema, projectEnquirySubmissionSchema } from "./leads";

const contact = { name: "Asha Shah", phone: "+919821502956", email: "", location: "Thane", message: "Please call me.", website: "", consent: true };

describe("lead submission validation", () => {
  it("requires explicit consent for contact leads", () => {
    expect(contactLeadSubmissionSchema.safeParse({ contact: { ...contact, consent: false }, formStartedAt: Date.now() }).success).toBe(false);
  });

  it("accepts tracking fields without allowing unknown fields", () => {
    const result = contactLeadSubmissionSchema.safeParse({ contact, formStartedAt: Date.now(), tracking: { sourcePage: "/contact", utmSource: "google" } });
    expect(result.success).toBe(true);
    expect(contactLeadSubmissionSchema.safeParse({ contact, formStartedAt: Date.now(), unexpected: "value" }).success).toBe(false);
  });

  it("validates project slugs and brochure email requirements", () => {
    expect(projectEnquirySubmissionSchema.safeParse({ projectSlug: "repair-audit-thane", contact, formStartedAt: Date.now() }).success).toBe(true);
    expect(projectEnquirySubmissionSchema.safeParse({ projectSlug: "../private", contact, formStartedAt: Date.now() }).success).toBe(false);
    expect(brochureSubmissionSchema.safeParse({ contact: { name: contact.name, phone: contact.phone, email: "not-an-email", website: "", consent: true }, formStartedAt: Date.now() }).success).toBe(false);
  });
});
