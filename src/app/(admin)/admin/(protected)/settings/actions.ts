"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { settingsSchema } from "@/lib/validation/settings";
import { saveSettings } from "@/server/services/settings";
export async function saveSettingsAction(input: unknown) { const session = await requirePermission("settings:write"); const parsed = settingsSchema.safeParse(input); if (!parsed.success) return { ok: false as const, error: parsed.error.flatten().fieldErrors }; try { const data = await saveSettings(parsed.data, session.user.id); revalidateTag("settings", "max"); for (const path of ["/", "/about", "/contact", "/estimate", "/admin/settings"]) revalidatePath(path); return { ok: true as const, data }; } catch { return { ok: false as const, error: { _form: ["Settings could not be saved."] } }; } }
