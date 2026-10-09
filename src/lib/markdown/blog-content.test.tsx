import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MarkdownRenderer } from "@/lib/markdown";

describe("blog post Markdown rendering", () => {
  it("sanitizes XSS payloads before rendering post content", () => {
    const html = renderToStaticMarkup(<MarkdownRenderer content={'# Article\n\n<script>alert("xss")</script><img src="x" onerror="alert(1)"> [bad](javascript:alert(1))'} />);
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("javascript:");
  });
});
