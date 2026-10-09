import { z } from "zod";

const id = z.string().trim().min(1).max(100);
const text = (max: number) => z.string().trim().min(1).max(max);
const nullableText = (max: number) => z.string().trim().max(max).nullable();
const money = z.number().finite().min(0).max(1_000_000_000);
const effectType = z.enum(["NONE", "SET_BASE_RATE", "ADD_PER_UNIT", "ADD_FLAT", "MULTIPLY_PERCENT"]);
const fieldType = z.enum(["SELECT", "RADIO", "NUMBER", "BOOLEAN", "MULTISELECT"]);

export const conditionOperatorSchema = z.enum(["equals", "notEquals", "in", "notIn", "gt", "gte", "lt", "lte"]);
export const conditionClauseSchema = z.object({ field: text(80), operator: conditionOperatorSchema, value: z.union([z.string().trim().max(160), z.number().finite(), z.boolean()]) }).strict();
export const showIfSchema = conditionClauseSchema.nullable();
export const ruleConditionSchema = z.object({ all: z.array(conditionClauseSchema).min(1).max(20) }).strict();

const optionSchema = z.object({ value: text(100), label: text(160), description: nullableText(300), effectType, effectValue: money.nullable(), sortOrder: z.number().int().min(0).max(10_000), isActive: z.boolean() }).strict().superRefine((value, context) => {
  if (value.effectType !== "NONE" && value.effectValue === null) context.addIssue({ code: "custom", path: ["effectValue"], message: "An effect value is required for this effect." });
  if (value.effectType === "MULTIPLY_PERCENT" && value.effectValue !== null && value.effectValue > 1000) context.addIssue({ code: "custom", path: ["effectValue"], message: "Percentage effects must be at most 1000%." });
});

const fieldSchema = z.object({ key: z.string().trim().regex(/^[a-z][a-z0-9_-]{1,79}$/), label: text(160), helpText: nullableText(300), type: fieldType, required: z.boolean(), sortOrder: z.number().int().min(0).max(10_000), min: z.number().int().nullable(), max: z.number().int().nullable(), step: z.number().int().positive().nullable(), defaultValue: nullableText(160), showIf: showIfSchema, effectType, effectValue: money.nullable(), options: z.array(optionSchema).max(100), isActive: z.boolean() }).strict().superRefine((value, context) => {
  if (value.min !== null && value.max !== null && value.min > value.max) context.addIssue({ code: "custom", path: ["max"], message: "Maximum must be greater than or equal to minimum." });
  if (value.effectType !== "NONE" && value.effectValue === null) context.addIssue({ code: "custom", path: ["effectValue"], message: "An effect value is required for this effect." });
});

const ruleSchema = z.object({ id: id.optional(), name: text(160), order: z.number().int().min(0).max(10_000), condition: ruleConditionSchema, effectType, effectValue: money, isActive: z.boolean() }).strict().superRefine((value, context) => { if (value.effectType === "MULTIPLY_PERCENT" && value.effectValue > 1000) context.addIssue({ code: "custom", path: ["effectValue"], message: "Percentage effects must be at most 1000%." }); });

export const estimatorServiceAdminSchema = z.object({ id: id, isActive: z.boolean(), pricingMode: z.enum(["ESTIMATE", "INSPECTION_ONLY"]), unit: z.enum(["SQFT", "RFT", "UNIT", "LUMPSUM"]), baseRate: money, minCharge: money, minArea: z.number().int().min(0).max(10_000_000), maxArea: z.number().int().min(0).max(10_000_000), spreadPercent: z.number().finite().min(0).max(100), roundTo: z.number().int().positive().max(10_000_000), sortOrder: z.number().int().min(0).max(10_000), disclaimer: nullableText(500), fields: z.array(fieldSchema).max(100), rules: z.array(ruleSchema).max(100) }).strict().superRefine((value, context) => {
  if (value.minArea > value.maxArea) context.addIssue({ code: "custom", path: ["maxArea"], message: "Maximum area must be greater than or equal to minimum area." });
  const keys = value.fields.map((field) => field.key);
  if (new Set(keys).size !== keys.length) context.addIssue({ code: "custom", path: ["fields"], message: "Field keys must be unique." });
});

export const locationZoneAdminSchema = z.object({ id: id.optional(), name: text(120), keywords: z.array(text(80)).min(1).max(30), multiplierPct: z.number().finite().min(-100).max(1000), sortOrder: z.number().int().min(0).max(10_000), isActive: z.boolean() }).strict();
export const locationZonesAdminSchema = z.object({ zones: z.array(locationZoneAdminSchema).max(100) }).strict();

export type EstimatorServiceAdminInput = z.infer<typeof estimatorServiceAdminSchema>;
export type LocationZoneAdminInput = z.infer<typeof locationZoneAdminSchema>;

export function clauseToCondition(clause: z.infer<typeof conditionClauseSchema>): Record<string, unknown> {
  return { field: clause.field, [clause.operator]: clause.operator === "in" || clause.operator === "notIn" ? [clause.value] : clause.value };
}

export function clausesToCondition(clauses: readonly z.infer<typeof conditionClauseSchema>[]): { all: Record<string, unknown>[] } {
  return { all: clauses.map(clauseToCondition) };
}
