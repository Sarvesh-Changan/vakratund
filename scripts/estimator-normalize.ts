import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaNeon } from "@prisma/adapter-neon";
import { loadStandaloneEnv, validateStandaloneEnvironment } from "../src/lib/standalone-env.ts";
import { calculateEstimate } from "../src/server/estimator/calculate.ts";
import type { Answers, EstimatorConfig, Field, Option, Rule } from "../src/server/estimator/types.ts";

const apply = process.argv.includes("--apply");
const loaded = loadStandaloneEnv();
const parsed = validateStandaloneEnvironment(loaded.environment);
if (!parsed.success || !parsed.data.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: parsed.data.DATABASE_URL }) });
function simplify(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const condition = value as Record<string, unknown>;
  if (Array.isArray(condition.all) && condition.all.length === 1 && condition.all[0] && typeof condition.all[0] === "object" && !Array.isArray(condition.all[0])) return condition.all[0];
  return value;
}
function configOf(service: Awaited<ReturnType<typeof prisma.estimatorService.findMany>>[number] & { fields: Array<{ options: Array<unknown> }>; rules: Array<unknown> }, zones: Array<{ id: string; name: string; keywords: string[]; multiplierPct: unknown; sortOrder: number; isActive: boolean }>): EstimatorConfig {
  const row = service as unknown as Record<string, unknown>;
  const fields = service.fields as unknown as Array<Record<string, unknown>>;
  const rules = service.rules as unknown as Array<Record<string, unknown>>;
  return { serviceId: String(row.id), slug: String(row.slug), name: String(row.name), pricingMode: String(row.pricingMode) as EstimatorConfig["pricingMode"], unit: String(row.unit) as EstimatorConfig["unit"], areaFieldKey: "area", baseRate: Number(row.baseRate), minCharge: Number(row.minCharge), minArea: Number(row.minArea), maxArea: Number(row.maxArea), spreadPercent: Number(row.spreadPercent), roundTo: Number(row.roundTo), version: Number(row.version), fields: fields.map((field) => ({ key: String(field.key), label: String(field.label), type: String(field.type) as Field["type"], required: Boolean(field.required), isAdvanced: Boolean(field.isAdvanced), sortOrder: Number(field.sortOrder), min: field.min === null ? null : Number(field.min), max: field.max === null ? null : Number(field.max), effectType: String(field.effectType) as Field["effectType"], effectValue: field.effectValue === null ? null : Number(field.effectValue), showIf: (simplify(field.showIf) as Field["showIf"]), options: (field.options as Array<Record<string, unknown>>).map((option) => ({ value: String(option.value), label: String(option.label), effectType: String(option.effectType) as Option["effectType"], effectValue: option.effectValue === null ? null : Number(option.effectValue), sortOrder: Number(option.sortOrder), isActive: Boolean(option.isActive) })) })), rules: rules.map((rule) => ({ id: String(rule.id), name: String(rule.name), order: Number(rule.order), condition: simplify(rule.condition) as Rule["condition"], effectType: String(rule.effectType) as Rule["effectType"], effectValue: Number(rule.effectValue), isActive: Boolean(rule.isActive) })), locationZones: zones.map((zone) => ({ ...zone, multiplierPct: Number(zone.multiplierPct) })) };
}
try {
  const services = await prisma.estimatorService.findMany({ include: { fields: { include: { options: true } }, rules: true } });
  const zones = await prisma.locationZone.findMany({ orderBy: { sortOrder: "asc" } });
  let changes = 0;
  const plans = services.map((service) => {
    const rules = service.rules.map((rule) => ({ ...rule, condition: simplify(rule.condition) }));
    const dropRuleIds = rules.filter((rule) => { const condition = rule.condition as Record<string, unknown>; return (Array.isArray(condition.all) && condition.all.length === 0) || (Array.isArray(condition.any) && condition.any.length === 0); }).map((rule) => rule.id);
    const fields = service.fields.map((field) => ({ ...field, showIf: simplify(field.showIf), clearFieldValue: field.effectType === "NONE" && field.effectValue !== null, options: field.options.map((option) => ({ ...option, clearValue: option.effectType === "NONE" && option.effectValue !== null })) }));
    const changed = JSON.stringify(rules) !== JSON.stringify(service.rules.map((rule) => ({ ...rule, condition: rule.condition }))) || fields.some((field) => field.clearFieldValue || field.options.some((option) => option.clearValue));
    if (!changed) return { service, rules, fields, dropRuleIds, changed: false };
    const before = configOf(service as never, zones);
    const afterRow = { ...service, fields: fields.map((field) => ({ ...field, effectValue: field.clearFieldValue ? null : field.effectValue, showIf: field.showIf, options: field.options.map((option) => ({ ...option, effectValue: option.clearValue ? null : option.effectValue })) })), rules: rules.filter((rule) => !dropRuleIds.includes(rule.id)) };
    const after = configOf(afterRow as never, zones);
    const answers = Array.from({ length: 40 }, (_, index): Answers => {
      const answer: Record<string, string | number | boolean | string[]> = {};
      for (const field of before.fields) {
        if (field.type === "NUMBER") answer[field.key] = Math.max(field.min ?? 1, Math.min(field.max ?? 1000, index * 17 + 1));
        else if (field.type === "MULTISELECT") answer[field.key] = index % 2 ? field.options.slice(0, 1).map((option) => option.value) : [];
        else if (field.required && field.type === "BOOLEAN") answer[field.key] = false;
        else if (field.required) answer[field.key] = field.options[0]?.value ?? "";
      }
      return answer;
    });
    if (answers.some((answer) => JSON.stringify(calculateEstimate(before, answer)) !== JSON.stringify(calculateEstimate(after, answer)))) throw new Error(`Estimate changed while planning cleanup for ${service.slug}; no writes were made.`);
    return { service, rules, fields, dropRuleIds, changed: true };
  });
  for (const plan of plans) if (plan.changed) {
    changes += 1;
    console.log(`${apply ? "APPLY" : "DRY-RUN"}: ${plan.service.name}; remove ${plan.dropRuleIds.length} empty conditions, simplify eligible conditions, clear no-price amounts.`);
  }
  if (apply && changes) await prisma.$transaction(async (tx) => {
    for (const plan of plans) if (plan.changed) {
      for (const field of plan.fields) {
        await tx.estimatorField.update({ where: { id: field.id }, data: { showIf: field.showIf as never, effectValue: field.clearFieldValue ? null : field.effectValue } });
        for (const option of field.options) if (option.clearValue) await tx.fieldOption.update({ where: { id: option.id }, data: { effectValue: null } });
      }
      for (const rule of plan.rules) if (!plan.dropRuleIds.includes(rule.id)) await tx.pricingRule.update({ where: { id: rule.id }, data: { condition: rule.condition as never } });
      if (plan.dropRuleIds.length) await tx.pricingRule.deleteMany({ where: { id: { in: plan.dropRuleIds } } });
      await tx.estimatorService.update({ where: { id: plan.service.id }, data: { version: { increment: 1 } } });
    }
  });
  if (!changes) console.log("No safe normalization changes found; configuration is already normalized.");
  else if (!apply) console.log("Dry run complete. No database changes were made. Re-run with --apply to write after backup.");
  else console.log(`Normalization applied to ${changes} service(s). Quote snapshots were not changed.`);
} finally { await prisma.$disconnect(); }
