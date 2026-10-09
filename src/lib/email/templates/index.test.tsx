import { describe, expect, it } from "vitest";

import { AdminNewLeadEmail, renderTemplate } from "@/lib/email/templates";

describe("email templates", () => {
  it("escape dynamic lead content in HTML and text output", async () => {
    const rendered = await renderTemplate(<AdminNewLeadEmail data={{ leadId: "lead-1", leadType: "CONTACT", name: "<script>alert(1)</script>", phone: "+919999999999", email: "visitor@example.test", location: "Thane", message: "<img src=x onerror=alert(1)>", sourcePage: "/contact", isDuplicate: false, adminUrl: "https://example.test" }} />);
    expect(rendered.html).not.toContain("<script>alert(1)</script>");
    expect(rendered.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(rendered.text).toContain("<script>alert(1)</script>");
  });
});
