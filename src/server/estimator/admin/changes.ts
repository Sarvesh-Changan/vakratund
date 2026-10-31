import type { EstimatorServiceAdminInput } from "@/lib/validation/estimator-admin";

type StoredOption = { value: string; label: string; description: string | null; effectType: string; effectValue: unknown; sortOrder: number; isActive: boolean };
type StoredField = { key: string; label: string; helpText: string | null; shortHelp: string | null; type: string; required: boolean; isAdvanced: boolean; sortOrder: number; min: number | null; max: number | null; step: number | null; defaultValue: string | null; presetValues: number[]; unitLabel: string | null; showIf: unknown; effectType: string; effectValue: unknown; isActive: boolean; options: StoredOption[] };
type StoredRule = { id: string; name: string; order: number; condition: unknown; effectType: string; effectValue: unknown; isActive: boolean };
export type StoredEstimatorService = { name: string; description: string | null; isActive: boolean; pricingMode: string; unit: string; baseRate: unknown; minCharge: unknown; minArea: number; maxArea: number; spreadPercent: unknown; roundTo: number; sortOrder: number; disclaimer: string | null; includedText: string[]; notIncludedText: string[]; fields: StoredField[]; rules: StoredRule[] };

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, stable(item)]));
  return value;
}

function normalizedCondition(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value ?? null;
  const condition = value as Record<string, unknown>;
  if (Array.isArray(condition.all)) {
    if (condition.all.length === 1) return normalizedCondition(condition.all[0]);
    return { all: condition.all.map(normalizedCondition) };
  }
  if (Array.isArray(condition.any)) return { any: condition.any.map(normalizedCondition) };
  return condition;
}

function conditionFromClause(value: unknown): unknown {
  if (!value || typeof value !== "object") return null;
  const clause = value as { field: string; operator: string; value: string | number | boolean };
  return { field: clause.field, [clause.operator]: ["in", "notIn"].includes(clause.operator) ? [clause.value] : clause.value };
}

function comparable(value: StoredEstimatorService | EstimatorServiceAdminInput): unknown {
  const input = value as EstimatorServiceAdminInput & { name?: string; description?: string | null };
  return stable({
    name: input.name ?? "", description: input.description ?? null,
    isActive: value.isActive, pricingMode: value.pricingMode, unit: value.unit,
    baseRate: Number(value.baseRate), minCharge: Number(value.minCharge), minArea: value.minArea, maxArea: value.maxArea, spreadPercent: Number(value.spreadPercent), roundTo: value.roundTo, sortOrder: value.sortOrder, disclaimer: value.disclaimer,
    includedText: value.includedText, notIncludedText: value.notIncludedText,
    fields: value.fields.map((field) => {
      const rawShowIf = field.showIf;
      const showIf = "advancedShowIf" in field && field.advancedShowIf ? field.advancedShowIf : rawShowIf && typeof rawShowIf === "object" && "operator" in rawShowIf ? conditionFromClause(rawShowIf) : rawShowIf;
      return { key: field.key, label: field.label, helpText: field.helpText || null, shortHelp: field.shortHelp || null, type: field.type, required: field.required, isAdvanced: field.isAdvanced, sortOrder: field.sortOrder, min: field.min, max: field.max, step: field.step, defaultValue: field.defaultValue || null, presetValues: field.presetValues, unitLabel: field.unitLabel || null, showIf: normalizedCondition(showIf), effectType: field.effectType, effectValue: field.effectValue === null ? null : Number(field.effectValue), isActive: field.isActive, options: field.options.map((option) => ({ value: option.value, label: option.label, description: option.description || null, effectType: option.effectType, effectValue: option.effectValue === null ? null : Number(option.effectValue), sortOrder: option.sortOrder, isActive: option.isActive })) };
    }),
    rules: value.rules.map((rule) => {
      const record = rule as unknown as { advancedCondition?: unknown; condition: unknown };
      const conditionValue = record.condition as { all?: unknown[] } | null;
      const isAdminClauses = Array.isArray(conditionValue?.all) && conditionValue.all.some((clause) => clause && typeof clause === "object" && "operator" in clause);
      const condition = record.advancedCondition ?? (isAdminClauses ? { all: conditionValue!.all!.map(conditionFromClause) } : record.condition);
      return { id: rule.id, name: rule.name, order: rule.order, condition: normalizedCondition(condition), effectType: rule.effectType, effectValue: Number(rule.effectValue), isActive: rule.isActive };
    }),
  });
}

export function estimatorConfigChanged(current: StoredEstimatorService, next: EstimatorServiceAdminInput): boolean {
  const nextWithCurrentBasics = { ...next, name: next.name ?? current.name, description: next.description === undefined ? current.description : next.description };
  return JSON.stringify(comparable(current)) !== JSON.stringify(comparable(nextWithCurrentBasics));
}

export function locationZoneConfigChanged(current: Array<{ id: string; name: string; keywords: string[]; multiplierPct: unknown; sortOrder: number; isActive: boolean }>, next: Array<{ id?: string; name: string; keywords: string[]; multiplierPct: number; sortOrder: number; isActive: boolean }>): boolean {
  const stableRows = (rows: Array<{ id?: string; name: string; keywords: string[]; multiplierPct: unknown; sortOrder: number; isActive: boolean }>) => rows.map((row) => ({ id: row.id ?? "", name: row.name, keywords: [...row.keywords], multiplierPct: Number(row.multiplierPct), sortOrder: row.sortOrder, isActive: row.isActive })).sort((a, b) => a.id.localeCompare(b.id) || a.name.localeCompare(b.name));
  return JSON.stringify(stableRows(current)) !== JSON.stringify(stableRows(next));
}
