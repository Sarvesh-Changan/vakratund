import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import type { ReactNode } from "react";

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: (defaultSchema.tagNames ?? []).filter((tag) => tag !== "img" && tag !== "iframe"),
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a ?? []), "href", "title"],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https", "mailto"],
  },
};

function isExternalLink(href: string | undefined): boolean {
  if (!href) return false;
  try {
    return new URL(href).protocol === "http:" || new URL(href).protocol === "https:";
  } catch {
    return false;
  }
}

const baseComponents: Components = {
  a: ({ node, href, children, ...props }) => {
    void node;
    const external = isExternalLink(href);
    return <a href={href} {...props} {...(external ? { rel: "noopener noreferrer nofollow", target: "_blank" } : {})}>{children}</a>;
  },
};

function headingText(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map((child) => headingText(child)).join("");
  return "";
}

function headingSlug(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-") || "section";
}

export function MarkdownRenderer({ content, className, headingIds }: { content: string; className?: string; headingIds?: readonly string[] }) {
  let headingIndex = 0;
  const components: Components = headingIds ? {
    ...baseComponents,
    h2: ({ children, ...props }) => { const id = headingIds[headingIndex] ?? headingSlug(headingText(children)); headingIndex += 1; return <h2 id={id} {...props}>{children}</h2>; },
    h3: ({ children, ...props }) => { const id = headingIds[headingIndex] ?? headingSlug(headingText(children)); headingIndex += 1; return <h3 id={id} {...props}>{children}</h3>; },
  } : baseComponents;
  return <div className={className}><ReactMarkdown skipHtml rehypePlugins={[[rehypeSanitize, sanitizeSchema]]} components={components}>{content}</ReactMarkdown></div>;
}
