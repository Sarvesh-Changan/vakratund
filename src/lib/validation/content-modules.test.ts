import { describe, expect, it } from "vitest";

import { createFaqSchema } from "@/lib/validation/faqs";
import { createTeamMemberSchema } from "@/lib/validation/team";
import { createTestimonialSchema } from "@/lib/validation/testimonials";

describe("content module validation", () => {
  it("accepts a general FAQ with Markdown and rejects HTML in the question", () => {
    const result = createFaqSchema.safeParse({ question: "How does it work?", answer: "**Site inspection** comes first. <script>alert(1)</script>", serviceId: null, status: "DRAFT", sortOrder: 0 });
    expect(result.success).toBe(true);
    expect(createFaqSchema.safeParse({ question: "<b>Unsafe</b>", answer: "Answer", serviceId: null, status: "DRAFT", sortOrder: 0 }).success).toBe(false);
  });

  it("allows an optional testimonial rating only from one through five", () => {
    const base = { name: "A. Client", roleOrOrg: "Secretary", quote: "Excellent work.", projectId: null, status: "PUBLISHED" as const, sortOrder: 0 };
    expect(createTestimonialSchema.safeParse({ ...base, rating: null }).success).toBe(true);
    expect(createTestimonialSchema.safeParse({ ...base, rating: 5 }).success).toBe(true);
    expect(createTestimonialSchema.safeParse({ ...base, rating: 0 }).success).toBe(false);
    expect(createTestimonialSchema.safeParse({ ...base, rating: 6 }).success).toBe(false);
  });

  it("validates a team photo reference and rejects unknown fields", () => {
    const valid = { name: "Er. Salil S. Chawan", qualification: "B.E. (Construction)", designation: "Proprietor", experienceYrs: 25, bio: "", photoId: null, sortOrder: 0, isVisible: true };
    expect(createTeamMemberSchema.safeParse(valid).success).toBe(true);
    expect(createTeamMemberSchema.safeParse({ ...valid, photoId: "not-a-cuid" }).success).toBe(false);
    expect(createTeamMemberSchema.safeParse({ ...valid, unexpected: true }).success).toBe(false);
  });
});
