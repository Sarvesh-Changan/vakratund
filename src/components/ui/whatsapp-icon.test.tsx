import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WhatsAppIcon } from "./whatsapp-icon";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "generated" ? [] : sourceFiles(path);
    return /\.[jt]sx?$/.test(entry.name) ? [path] : [];
  });
}

describe("WhatsAppIcon", () => {
  it("is decorative by default", () => {
    const { container } = render(<WhatsAppIcon />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.hasAttribute("role")).toBe(false);
  });

  it("has an accessible image name when titled", () => {
    render(<WhatsAppIcon title="WhatsApp brand mark" />);
    expect(screen.getByRole("img", { name: "WhatsApp brand mark" })).toBeTruthy();
  });

  it("does not leave Lucide chat placeholders in source imports", () => {
    const files = sourceFiles(join(process.cwd(), "src"));
    const placeholderImport = /import\s*\{[\s\S]*?\b(?:MessageCircle|MessageSquare|MessagesSquare|MessageCircleMore|MessageSquareText)\b[\s\S]*?\}\s*from\s*["']lucide-react["']/;

    for (const file of files) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(placeholderImport);
    }
  });
});
