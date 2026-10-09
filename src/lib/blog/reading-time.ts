const WORDS_PER_MINUTE = 200;

/** Returns the minimum one-minute reading estimate for Markdown content. */
export function calculateReadingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
