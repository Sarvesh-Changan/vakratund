"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { pageSectionInputSchema } from "@/lib/validation/pages";
import { savePageSection } from "@/server/services/pages";
export async function savePageSectionAction(input: unknown) { const session = await requirePermission("content:write"); const parsed = pageSectionInputSchema.safeParse(input); if (!parsed.success) return { ok: false as const, error: parsed.error.flatten().fieldErrors }; try { const data = await savePageSection(parsed.data, session.user.id); revalidateTag("pages", "max"); revalidatePath("/"); revalidatePath("/about"); revalidatePath("/admin/pages"); return { ok: true as const, data }; } catch { return { ok: false as const, error: { _form: ["The section could not be saved."] } }; } }
