"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requirePermission } from "@/lib/auth/session";
import { estimatorServiceAdminSchema, locationZonesAdminSchema } from "@/lib/validation/estimator-admin";
import { saveEstimatorService as saveEstimatorServiceRecord, saveLocationZones as saveLocationZonesRecord } from "@/server/services/estimator-admin";

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
