import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MarkdownRenderer } from "@/lib/markdown";

describe("MarkdownRenderer", () => {
  it("removes raw HTML and XSS payloads", () => {
    const html = renderToStaticMarkup(<MarkdownRenderer content={'<script>alert("xss")</script>\n\n<img src="x" onerror="alert(1)"> [bad](javascript:alert(1))'} />);
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("javascript:");
  });

  it("adds safe external link attributes", () => {
    const html = renderToStaticMarkup(<MarkdownRenderer content="[Official site](https://example.com) [Internal](/contact)" />);
    expect(html).toContain('rel="noopener noreferrer nofollow"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('href="/contact"');
  });
});
