import type { EffectType, FieldType, PricingMode } from "@/server/estimator/types";

export const estimatorVocabulary = {
  effects: {
    SET_BASE_RATE: { label: "Use this price per unit", help: "Replaces the usual price for every unit. Example: ₹2,000 per sq ft × 1,000 sq ft = ₹20,00,000." },
    ADD_PER_UNIT: { label: "Add ₹ per unit", help: "Adds this amount for every unit. Example: ₹100 × 1,000 sq ft = ₹1,00,000." },
    ADD_FLAT: { label: "Add a fixed ₹ amount", help: "Adds this amount once, whatever the project size." },
    MULTIPLY_PERCENT: { label: "Increase or decrease total by %", help: "Changes the current total by this percentage. A negative number lowers it." },
    NONE: { label: "No price change", help: "This answer does not change the estimate." },
  } satisfies Record<EffectType, { label: string; help: string }>,
  fields: {
    NUMBER: { label: "Number", help: "The visitor enters a number, such as area or floor count." },
    RADIO: { label: "Pick one (cards)", help: "The visitor picks one answer shown as a card." },
    SELECT: { label: "Pick one (list)", help: "The visitor picks one answer from a list." },
    MULTISELECT: { label: "Pick several", help: "The visitor may choose more than one answer." },
    BOOLEAN: { label: "Yes / No", help: "The visitor answers yes or no." },
  } satisfies Record<FieldType, { label: string; help: string }>,
  pricingModes: {
    ESTIMATE: { label: "Show a price estimate", help: "Visitors see an indicative price range." },
    INSPECTION_ONLY: { label: "Site inspection first (no price)", help: "Visitors send a request so the team can assess the work." },
  } satisfies Record<PricingMode, { label: string; help: string }>,
  terms: {
    zone: { label: "Location surcharge", help: "An optional price change for a named area." },
    rule: { label: "Special condition", help: "A price change that applies when an answer matches." },
    showIf: { label: "Show this question only if", help: "Use an earlier answer to decide when this question appears." },
  },
  units: { SQFT: "sq ft", RFT: "running ft", UNIT: "unit", LUMPSUM: "lump sum" },
} as const;

export function effectLabel(type: EffectType): string { return estimatorVocabulary.effects[type].label; }
export function fieldTypeLabel(type: FieldType): string { return estimatorVocabulary.fields[type].label; }
export function pricingModeLabel(mode: PricingMode): string { return estimatorVocabulary.pricingModes[mode].label; }
