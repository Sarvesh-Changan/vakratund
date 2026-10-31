import { calculateEstimate } from "./calculate";
import type { Answers, EstimatorConfig, EstimateResult } from "./types";

export type EstimateExplanation = { result: EstimateResult; steps: string[] };

const money = (value: number) => `₹${Math.abs(value).toLocaleString("en-IN")}`;

/** Presentation-only wording derived from the engine's authoritative breakdown. */
export function explainEstimate(config: EstimatorConfig, answers: Answers): EstimateExplanation {
  const result = calculateEstimate(config, answers);
  if (result.low === null || result.high === null) return { result, steps: result.warnings };
  const areaValue = answers[config.areaFieldKey];
  const area = typeof areaValue === "number" ? areaValue : 0;
  const unit = config.unit === "SQFT" ? "sq ft" : config.unit === "RFT" ? "running ft" : config.unit === "UNIT" ? "units" : "lump sum";
  const steps = result.breakdown.map((item) => {
    if (item.kind === "BASE") return `${area.toLocaleString("en-IN")} ${unit} × ${item.detail?.split("×")[1]?.trim() ?? money(config.baseRate)} = ${money(item.amount)}`;
    if (item.kind === "LOCATION") return `${item.label} ${item.amount < 0 ? "discount" : "increase"}: ${item.detail ?? money(item.amount)}`;
    if (item.kind === "MINIMUM") return `Minimum job charge added: ${money(item.amount)}`;
    if (item.kind === "ADD_PER_UNIT") return `${item.label}: ${item.detail ?? money(item.amount)} = ${money(item.amount)}`;
    if (item.kind === "ADD_FLAT") return `${item.label}: ${money(item.amount)} added`;
    if (item.kind === "PERCENT") return `${item.label}: ${item.detail ?? "percentage change"} = ${item.amount < 0 ? "−" : "+"}${money(item.amount)}`;
    if (item.kind === "RULE") return `${item.label}: ${item.amount < 0 ? "−" : "+"}${money(item.amount)}`;
    return `${item.label}: ${money(item.amount)}`;
  });
  if (!result.breakdown.some((item) => item.kind === "MINIMUM")) steps.push("Minimum job charge not needed.");
  steps.push(`Range: plus or minus ${config.spreadPercent}% → ${money(result.low)} to ${money(result.high)}.`);
  return { result, steps };
}
