"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { pageSeoSchema } from "@/lib/validation/seo";
import { savePageSeo } from "@/server/services/seo";
export async function saveSeoAction(input: unknown) { const session = await requirePermission("seo:write"); const parsed = pageSeoSchema.safeParse(input); if (!parsed.success) return { ok: false as const, error: parsed.error.flatten().fieldErrors }; try { const data = await savePageSeo(parsed.data, session.user.id); revalidateTag("seo", "max"); revalidatePath(parsed.data.path); revalidatePath("/admin/seo"); return { ok: true as const, data }; } catch { return { ok: false as const, error: { _form: ["SEO metadata could not be saved."] } }; } }
