import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/client";
import type { Condition, EstimatorConfig, Field, LocationZone, Option, Rule } from "./types";

function numberValue(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

function condition(value: unknown): Condition | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  if (Array.isArray(record.all) && record.all.every((item) => condition(item))) return { all: record.all.map((item) => condition(item) as Condition) };
  if (Array.isArray(record.any) && record.any.every((item) => condition(item))) return { any: record.any.map((item) => condition(item) as Condition) };
  if (typeof record.field !== "string" || record.field.length === 0) return undefined;
  const allowed = ["equals", "notEquals", "in", "notIn", "gt", "gte", "lt", "lte"] as const;
  if (Object.keys(record).some((key) => key !== "field" && !allowed.includes(key as typeof allowed[number]))) return undefined;
  return { field: record.field, ...(record.equals !== undefined ? { equals: record.equals as never } : {}), ...(record.notEquals !== undefined ? { notEquals: record.notEquals as never } : {}), ...(Array.isArray(record.in) ? { in: record.in as never } : {}), ...(Array.isArray(record.notIn) ? { notIn: record.notIn as never } : {}), ...(typeof record.gt === "number" ? { gt: record.gt } : {}), ...(typeof record.gte === "number" ? { gte: record.gte } : {}), ...(typeof record.lt === "number" ? { lt: record.lt } : {}), ...(typeof record.lte === "number" ? { lte: record.lte } : {}) };
}

async function readEstimatorConfig(slug: string): Promise<EstimatorConfig | null> {
  const row = await prisma.estimatorService.findFirst({ where: { slug, isActive: true }, include: { fields: { where: { isActive: true }, orderBy: { sortOrder: "asc" }, include: { options: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } } }, rules: { where: { isActive: true }, orderBy: [{ order: "asc" }, { id: "asc" }] } } });
  if (!row) return null;
  const zones = await prisma.locationZone.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  const fields: Field[] = row.fields.map((field) => ({ key: field.key, label: field.label, helpText: field.helpText, shortHelp: field.shortHelp, type: String(field.type) as Field["type"], required: field.required, isAdvanced: field.isAdvanced, sortOrder: field.sortOrder, min: field.min, max: field.max, step: field.step, defaultValue: field.defaultValue, presetValues: field.presetValues, unitLabel: field.unitLabel, showIf: condition(field.showIf), effectType: String(field.effectType) as Field["effectType"], effectValue: numberValue(field.effectValue), options: field.options.map((option) => ({ value: option.value, label: option.label, description: option.description, effectType: String(option.effectType) as Option["effectType"], effectValue: numberValue(option.effectValue), sortOrder: option.sortOrder, isActive: option.isActive })) }));
  const rules: Rule[] = row.rules.flatMap((rule) => { const parsed = condition(rule.condition); return parsed ? [{ id: rule.id, name: rule.name, order: rule.order, condition: parsed, effectType: String(rule.effectType) as Rule["effectType"], effectValue: numberValue(rule.effectValue) ?? 0, isActive: rule.isActive }] : []; });
  const locationZones: LocationZone[] = zones.map((zone) => ({ id: zone.id, name: zone.name, keywords: zone.keywords, multiplierPct: numberValue(zone.multiplierPct) ?? 0, sortOrder: zone.sortOrder, isActive: zone.isActive }));
  return { serviceId: row.id, slug: row.slug, name: row.name, description: row.description, includedText: row.includedText, notIncludedText: row.notIncludedText, pricingMode: String(row.pricingMode) as EstimatorConfig["pricingMode"], unit: String(row.unit) as EstimatorConfig["unit"], areaFieldKey: "area", baseRate: numberValue(row.baseRate) ?? 0, minCharge: numberValue(row.minCharge) ?? 0, minArea: row.minArea, maxArea: row.maxArea, spreadPercent: numberValue(row.spreadPercent) ?? 0, roundTo: row.roundTo, disclaimer: row.disclaimer, version: row.version, fields, rules, locationZones };
}

export function getEstimatorConfig(slug: string): Promise<EstimatorConfig | null> {
  return unstable_cache(() => readEstimatorConfig(slug), ["estimator-config", slug], { tags: ["estimator", `estimator:${slug}`], revalidate: 3600 })();
}

export function loadEstimatorConfigFromDatabase(slug: string): Promise<EstimatorConfig | null> {
  return readEstimatorConfig(slug);
}

async function readEstimatorConfigs(): Promise<EstimatorConfig[]> {
  const services = await prisma.estimatorService.findMany({ where: { isActive: true }, select: { slug: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  const configs = await Promise.all(services.map((service) => readEstimatorConfig(service.slug)));
  return configs.filter((config): config is EstimatorConfig => config !== null);
}

export function getEstimatorConfigs(): Promise<EstimatorConfig[]> {
  return unstable_cache(readEstimatorConfigs, ["estimator-configs"], { tags: ["estimator"], revalidate: 3600 })();
}
