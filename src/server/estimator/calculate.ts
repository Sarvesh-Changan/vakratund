import { conditionMatches } from "./conditions";
import { validateAnswers, visibleFields } from "./validate";
import type { Answers, BreakdownLineItem, EffectType, EstimatorConfig, Field, Option, EstimateResult } from "./types";

const CENTS = 100;
const BASIS_POINTS = 10_000;

function cents(value: number): number {
  return Math.round(value * CENTS);
}

function rupees(value: number): number {
  return value / CENTS;
}

function percentCents(amount: number, percent: number): number {
  return Math.round(amount * Math.round(percent * 100) / BASIS_POINTS);
}

function applyPercent(amount: number, percent: number): number {
  return amount + percentCents(amount, percent);
}

function roundToIncrement(amount: number, roundTo: number): number {
  const increment = cents(roundTo);
  if (increment <= 0) return amount;
  return Math.round(amount / increment) * increment;
}

function selectedOptions(config: EstimatorConfig, answers: Answers): Array<{ field: Field; option: Option }> {
  const selected: Array<{ field: Field; option: Option }> = [];
  for (const field of visibleFields(config, answers)) {
    const value = answers[field.key];
    const values = Array.isArray(value) ? value : [value];
    for (const option of field.options.filter((item) => item.isActive !== false)) {
      if (values.includes(option.value)) selected.push({ field, option });
    }
  }
  return selected;
}

type EffectSource = { id: string; label: string; effectType: EffectType; effectValue: number | null };

function selectedFieldEffects(config: EstimatorConfig, answers: Answers): EffectSource[] {
  return visibleFields(config, answers)
    .filter((field) => { const value = answers[field.key]; return value !== undefined && value !== "" && !(Array.isArray(value) && value.length === 0) && field.effectType !== "NONE" && field.effectValue !== null; })
    .map((field) => ({ id: `field-${field.key}`, label: field.label, effectType: field.effectType, effectValue: field.effectValue }));
}

function line(id: string, label: string, kind: BreakdownLineItem["kind"], amount: number, detail?: string): BreakdownLineItem {
  return { id, label, kind, amount: rupees(amount), ...(detail ? { detail } : {}) };
}

function areaFrom(answers: Answers, key: string): number {
  return typeof answers[key] === "number" && Number.isFinite(answers[key]) ? answers[key] as number : 0;
}

function applyEffect(amount: number, effectType: EffectType, effectValue: number, area: number): number {
  if (effectType === "ADD_PER_UNIT") return amount + cents(effectValue * area);
  if (effectType === "ADD_FLAT") return amount + cents(effectValue);
  if (effectType === "MULTIPLY_PERCENT") return applyPercent(amount, effectValue);
  return amount;
}

function effectDetail(effectType: EffectType, value: number): string {
  if (effectType === "MULTIPLY_PERCENT") return `${value}%`;
  return `₹${value.toLocaleString("en-IN")}`;
}

function locationFor(config: EstimatorConfig, answers: Answers): EstimatorConfig["locationZones"][number] | undefined {
  const value = answers.location;
  if (typeof value !== "string") return undefined;
  const needle = value.trim().toLowerCase();
  return config.locationZones.find((zone) => zone.id.toLowerCase() === needle || zone.name.toLowerCase() === needle || zone.keywords.some((keyword) => keyword.toLowerCase() === needle));
}

export function calculateEstimate(config: EstimatorConfig, answers: Answers): EstimateResult {
  const validation = validateAnswers(config, answers);
  if (!validation.valid) return { low: null, high: null, breakdown: [], warnings: validation.errors.map((error) => `${error.field}: ${error.message}`) };

  const warnings: string[] = [];
  if (config.disclaimer) warnings.push(config.disclaimer);
  const area = areaFrom(answers, config.areaFieldKey);
  if (config.pricingMode === "INSPECTION_ONLY") {
    warnings.push("This service requires a site inspection before pricing.");
    return { low: null, high: null, breakdown: [], warnings };
  }

  const breakdown: BreakdownLineItem[] = [];
  const options = selectedOptions(config, answers);
  const fieldEffects = selectedFieldEffects(config, answers);
  const effects: EffectSource[] = [...fieldEffects, ...options.map(({ option }) => ({ id: `option-${option.value}`, label: option.label, effectType: option.effectType, effectValue: option.effectValue }))];
  const baseRateSource = effects.filter((source) => source.effectType === "SET_BASE_RATE" && source.effectValue !== null).at(-1);
  const baseRate = baseRateSource?.effectValue ?? config.baseRate;
  let subtotal = cents(area * baseRate);
  breakdown.push(line("base", "Base estimate", "BASE", subtotal, `${area} × ₹${baseRate.toLocaleString("en-IN")}`));
  if (baseRateSource) breakdown.push(line("base-rate-override", "Selected base-rate option", "ADD_FLAT", 0, baseRateSource.label));

  for (const source of effects) {
    if (source.effectValue === null || source.effectType !== "ADD_PER_UNIT") continue;
    const amount = cents(source.effectValue * area);
    subtotal += amount;
    breakdown.push(line(`${source.id}-unit`, source.label, "ADD_PER_UNIT", amount, `${effectDetail(source.effectType, source.effectValue)} × ${area}`));
  }
  for (const source of effects) {
    if (source.effectValue === null || source.effectType !== "ADD_FLAT") continue;
    const amount = cents(source.effectValue);
    subtotal += amount;
    breakdown.push(line(`${source.id}-flat`, source.label, "ADD_FLAT", amount, effectDetail(source.effectType, source.effectValue)));
  }

  for (const rule of [...config.rules].filter((item) => item.isActive !== false).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))) {
    if (!conditionMatches(rule.condition, answers)) continue;
    const before = subtotal;
    if (rule.effectType === "SET_BASE_RATE") subtotal = cents(area * rule.effectValue);
    else subtotal = applyEffect(subtotal, rule.effectType, rule.effectValue, area);
    breakdown.push(line(`rule-${rule.id}`, rule.name, "RULE", subtotal - before, effectDetail(rule.effectType, rule.effectValue)));
  }

  for (const source of effects) {
    if (source.effectValue === null || source.effectType !== "MULTIPLY_PERCENT") continue;
    const before = subtotal;
    subtotal = applyPercent(subtotal, source.effectValue);
    breakdown.push(line(`${source.id}-percent`, source.label, "PERCENT", subtotal - before, effectDetail(source.effectType, source.effectValue)));
  }
  const location = locationFor(config, answers);
  if (location && location.multiplierPct !== 0) {
    const before = subtotal;
    subtotal = applyPercent(subtotal, location.multiplierPct);
    breakdown.push(line(`location-${location.id}`, location.name, "LOCATION", subtotal - before, effectDetail("MULTIPLY_PERCENT", location.multiplierPct)));
  }

  const minimum = cents(config.minCharge);
  if (subtotal < minimum) {
    breakdown.push(line("minimum-charge", "Minimum charge adjustment", "MINIMUM", minimum - subtotal, `Minimum ₹${config.minCharge.toLocaleString("en-IN")}`));
    subtotal = minimum;
  }
  const spread = Math.max(0, config.spreadPercent);
  const low = roundToIncrement(Math.max(0, subtotal - percentCents(subtotal, spread)), config.roundTo);
  const high = roundToIncrement(subtotal + percentCents(subtotal, spread), config.roundTo);
  return { low: rupees(low), high: rupees(high), breakdown, warnings };
}
