import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";
import type { SettingsInput } from "@/lib/validation/settings";
import { logActivity } from "@/server/services/activity";

export type SettingsView = { id: string; updatedAt: string; businessName: string; tagline: string; phones: string[]; email: string; whatsappNumber: string; whatsappMessage: string; address: string; mapEmbedUrl: string; businessHours: NonNullable<SettingsInput["businessHours"]>; socials: NonNullable<SettingsInput["socials"]>; credentials: NonNullable<SettingsInput["credentials"]>; brochureMediaId: string | null; notifyEmails: string[]; foundedYear: number };
const settingsSelect = { id: true, businessName: true, tagline: true, phones: true, email: true, whatsappNumber: true, whatsappMessage: true, address: true, mapEmbedUrl: true, businessHours: true, socials: true, credentials: true, brochureMediaId: true, notifyEmails: true, foundedYear: true, updatedAt: true } satisfies Prisma.SiteSettingSelect;
type SettingsRecord = Prisma.SiteSettingGetPayload<{ select: typeof settingsSelect }>;
const defaultHours = { monday: { closed: false, open: "09:00", close: "18:00" }, tuesday: { closed: false, open: "09:00", close: "18:00" }, wednesday: { closed: false, open: "09:00", close: "18:00" }, thursday: { closed: false, open: "09:00", close: "18:00" }, friday: { closed: false, open: "09:00", close: "18:00" }, saturday: { closed: false, open: "09:00", close: "18:00" }, sunday: { closed: true, open: "09:00", close: "18:00" } };
export function emptySettings(): SettingsInput { return { businessName: "M/s. Vakratund Construction", tagline: "", phones: [], email: "", whatsappNumber: "", whatsappMessage: "", address: "", mapEmbedUrl: "", businessHours: defaultHours, socials: [], credentials: [], brochureMediaId: null, notifyEmails: [], foundedYear: 2003 }; }
function toView(row: SettingsRecord): SettingsView { return { id: row.id, businessName: row.businessName, tagline: row.tagline ?? "", phones: row.phones, email: row.email ?? "", whatsappNumber: row.whatsappNumber ?? "", whatsappMessage: row.whatsappMessage ?? "", address: row.address ?? "", mapEmbedUrl: row.mapEmbedUrl ?? "", businessHours: row.businessHours as SettingsInput["businessHours"], socials: row.socials as SettingsInput["socials"], credentials: row.credentials as SettingsInput["credentials"], brochureMediaId: row.brochureMediaId, notifyEmails: row.notifyEmails, foundedYear: row.foundedYear, updatedAt: row.updatedAt.toISOString() }; }

export async function getSettings(): Promise<SettingsView> { const row = await prisma.siteSetting.findUnique({ where: { id: "singleton" }, select: settingsSelect }); return row ? toView(row) : { ...emptySettings(), tagline: "", whatsappMessage: "", address: "", socials: [], credentials: [], id: "singleton", updatedAt: new Date(0).toISOString() } as SettingsView; }
export async function saveSettings(input: SettingsInput, userId: string): Promise<SettingsView> {
  const brochure = input.brochureMediaId ? await prisma.mediaAsset.findUnique({ where: { id: input.brochureMediaId }, select: { id: true, kind: true } }) : null;
  if (input.brochureMediaId && (!brochure || brochure.kind !== "DOCUMENT")) throw new Error("The brochure must reference a document media asset.");
  const data: Prisma.SiteSettingUncheckedCreateInput = { id: "singleton", businessName: input.businessName, tagline: input.tagline || null, phones: input.phones, email: input.email || null, whatsappNumber: input.whatsappNumber || null, whatsappMessage: input.whatsappMessage || null, address: input.address || null, mapEmbedUrl: input.mapEmbedUrl || null, businessHours: input.businessHours as Prisma.InputJsonValue, socials: input.socials as Prisma.InputJsonValue, credentials: input.credentials as Prisma.InputJsonValue, brochureMediaId: input.brochureMediaId, notifyEmails: input.notifyEmails, foundedYear: input.foundedYear };
  const row = await prisma.siteSetting.upsert({ where: { id: "singleton" }, create: data, update: data, select: settingsSelect });
  await logActivity({ userId, action: "settings.save", entityType: "SiteSetting", entityId: row.id, summary: "Updated business settings", diff: { businessNameChanged: true, phoneCount: row.phones.length, hasEmail: Boolean(row.email), hasMap: Boolean(row.mapEmbedUrl), credentialCount: Array.isArray(row.credentials) ? row.credentials.length : 0, notifyEmailCount: row.notifyEmails.length, brochureChanged: Boolean(row.brochureMediaId) } });
  return toView(row);
}
