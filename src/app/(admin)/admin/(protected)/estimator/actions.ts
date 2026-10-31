"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requirePermission } from "@/lib/auth/session";
import { estimatorServiceAdminSchema, locationZonesAdminSchema } from "@/lib/validation/estimator-admin";
import { createEstimatorFromTemplate as createEstimatorFromTemplateRecord, duplicateEstimatorService as duplicateEstimatorServiceRecord, saveEstimatorService as saveEstimatorServiceRecord, saveLocationZones as saveLocationZonesRecord } from "@/server/services/estimator-admin";
import { estimatorTemplates } from "@/config/estimator-templates";
import { z } from "zod";

export type EstimatorActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };

function invalid(error: { flatten: () => { fieldErrors: Record<string, string[]> } }): EstimatorActionResult<never> { return { ok: false, error: { code: "VALIDATION_ERROR", message: "Please correct the highlighted estimator fields.", fieldErrors: error.flatten().fieldErrors } }; }
function failed(): EstimatorActionResult<never> { return { ok: false, error: { code: "MUTATION_FAILED", message: "The estimator could not be saved. No changes were applied." } }; }
function refresh(): void { revalidateTag("estimator", "max"); revalidatePath("/admin/estimator"); }

export async function saveEstimatorService(input: unknown): Promise<EstimatorActionResult<{ version: number }>> {
  const session = await requirePermission("estimator:write");
  const parsed = estimatorServiceAdminSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try { const data = await saveEstimatorServiceRecord(parsed.data, session.user.id); refresh(); return { ok: true, data }; } catch { return failed(); }
}

export async function saveLocationZones(input: unknown): Promise<EstimatorActionResult> {
  const session = await requirePermission("estimator:write");
  const parsed = locationZonesAdminSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try { await saveLocationZonesRecord(parsed.data, session.user.id); refresh(); return { ok: true, data: undefined }; } catch { return failed(); }
}

const createSchema = z.object({ templateId: z.enum(estimatorTemplates.map((template) => template.id) as [string, ...string[]]), name: z.string().trim().min(2).max(160) }).strict();
export async function createEstimatorFromTemplate(input: unknown): Promise<EstimatorActionResult<{ id: string; slug: string }>> {
  const session = await requirePermission("estimator:write");
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try { const data = await createEstimatorFromTemplateRecord(parsed.data.templateId as never, parsed.data.name, session.user.id); refresh(); return { ok: true, data }; } catch { return failed(); }
}

const duplicateSchema = z.object({ id: z.string().trim().min(1).max(100) }).strict();
export async function duplicateEstimatorService(input: unknown): Promise<EstimatorActionResult<{ id: string; slug: string }>> {
  const session = await requirePermission("estimator:write");
  const parsed = duplicateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try { const data = await duplicateEstimatorServiceRecord(parsed.data.id, session.user.id); refresh(); return { ok: true, data }; } catch { return failed(); }
}
