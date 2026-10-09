import { z } from "zod";

const projectSearchSchema = z.object({
  service: z.preprocess((value) => value === "" ? undefined : value, z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional()),
  status: z.enum(["COMPLETED", "ONGOING"]).optional(),
  year: z.coerce.number().int().min(1900).max(2200).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});

export type PublicProjectSearchParams = Record<string, string | string[] | undefined>;
export type ParsedProjectSearch = {
  filters: { serviceSlug?: string; status?: "COMPLETED" | "ONGOING"; year?: number };
  page: number;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseProjectSearchParams(params: PublicProjectSearchParams): ParsedProjectSearch {
  const result = projectSearchSchema.safeParse({ service: first(params.service), status: first(params.status), year: first(params.year), page: first(params.page) });
  if (!result.success) return { filters: {}, page: 1 };
  return { filters: { serviceSlug: result.data.service, status: result.data.status, year: result.data.year }, page: result.data.page };
}
