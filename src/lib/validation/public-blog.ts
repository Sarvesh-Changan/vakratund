import { z } from "zod";

const blogSearchSchema = z.object({
  category: z.preprocess((value) => value === "" ? undefined : value, z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional()),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});

export type PublicBlogSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseBlogSearchParams(params: PublicBlogSearchParams): { categorySlug?: string; page: number } {
  const parsed = blogSearchSchema.safeParse({ category: first(params.category), page: first(params.page) });
  if (!parsed.success) return { page: 1 };
  return { categorySlug: parsed.data.category, page: parsed.data.page };
}
