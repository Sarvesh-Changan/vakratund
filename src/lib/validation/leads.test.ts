import { describe, expect, it } from "vitest";
import { contactLeadSubmissionSchema, projectEnquirySubmissionSchema } from "./leads";

const contact = { name: "Asha Shah", phone: "+919821502956", email: "", location: "Thane", message: "Please call me.", website: "" };

describe("lead submission validation", () => {
  it("accepts contact leads without a consent field", () => {
    expect(contactLeadSubmissionSchema.safeParse({ contact, formStartedAt: Date.now() }).success).toBe(true);
  });

  it("accepts tracking fields without allowing unknown fields", () => {
    const result = contactLeadSubmissionSchema.safeParse({ contact, formStartedAt: Date.now(), tracking: { sourcePage: "/contact", utmSource: "google" } });
    expect(result.success).toBe(true);
    expect(contactLeadSubmissionSchema.safeParse({ contact, formStartedAt: Date.now(), unexpected: "value" }).success).toBe(false);
  });

  it("validates project slugs", () => {
    expect(projectEnquirySubmissionSchema.safeParse({ projectSlug: "repair-audit-thane", contact, formStartedAt: Date.now() }).success).toBe(true);
    expect(projectEnquirySubmissionSchema.safeParse({ projectSlug: "../private", contact, formStartedAt: Date.now() }).success).toBe(false);
  });
});
