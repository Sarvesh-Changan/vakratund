export type BlogHeading = { id: string; text: string; level: 2 | 3 };

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-") || "section";
}

export function extractBlogHeadings(content: string): BlogHeading[] {
  const used = new Map<string, number>();
  return content.split(/\r?\n/).flatMap((line) => {
    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!match) return [];
    const level = match[1]?.length === 3 ? 3 : 2;
    const text = (match[2] ?? "").replace(/[*_`\[\]]/g, "").trim();
    const base = slugify(text);
    const occurrence = used.get(base) ?? 0;
    used.set(base, occurrence + 1);
    return [{ id: occurrence === 0 ? base : `${base}-${occurrence + 1}`, text, level }];
  });
}
