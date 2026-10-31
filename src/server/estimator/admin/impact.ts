import { calculateEstimate } from "../calculate";
import type { Answers, EstimatorConfig, Field } from "../types";

export type ImpactScenario = { label: string; todayLow: number | null; todayHigh: number | null; nextLow: number | null; nextHigh: number | null; changed: boolean; changePercent: number };

function sampleAnswers(config: EstimatorConfig, area: number, choice?: { field: Field; value: string }): Answers {
  const answers: Record<string, string | number | boolean | string[]> = {};
  for (const field of config.fields.filter((item) => item.isActive !== false)) {
    if (field.key === config.areaFieldKey || field.type === "NUMBER") answers[field.key] = field.key === config.areaFieldKey ? area : Number(field.defaultValue ?? field.min ?? 1);
    else if (field.type === "BOOLEAN") { if (field.required) answers[field.key] = field.defaultValue === "true"; }
    else if (field.type === "MULTISELECT") answers[field.key] = [];
    else if (choice?.field.key === field.key) answers[field.key] = choice.value;
    else if (field.required || field.defaultValue) answers[field.key] = field.defaultValue ?? field.options[0]?.value ?? "";
  }
  return answers;
}

export function estimatorImpactPreview(today: EstimatorConfig, proposed: EstimatorConfig): ImpactScenario[] {
  const areas = [...new Set([proposed.minArea, Math.round((proposed.minArea + proposed.maxArea) / 2), proposed.maxArea])];
  const samples: Array<{ label: string; area: number; choice?: { field: Field; value: string } }> = areas.map((area, index) => ({ label: ["Smallest project", "Typical project", "Largest project"][index]!, area }));
  const mainChoices = proposed.fields.find((field) => field.isActive !== false && !field.isAdvanced && field.options.length > 0);
  if (mainChoices) for (const option of mainChoices.options.slice(0, 3)) samples.push({ label: option.label, area: areas[1] ?? proposed.minArea, choice: { field: mainChoices, value: option.value } });
  return samples.slice(0, 6).map((sample) => {
    const before = calculateEstimate(today, sampleAnswers(today, sample.area, sample.choice));
    const after = calculateEstimate(proposed, sampleAnswers(proposed, sample.area, sample.choice));
    const changed = before.low !== after.low || before.high !== after.high;
    const oldMid = before.low !== null && before.high !== null ? (before.low + before.high) / 2 : 0;
    const newMid = after.low !== null && after.high !== null ? (after.low + after.high) / 2 : 0;
    return { label: sample.label, todayLow: before.low, todayHigh: before.high, nextLow: after.low, nextHigh: after.high, changed, changePercent: oldMid > 0 ? ((newMid - oldMid) / oldMid) * 100 : newMid === 0 ? 0 : 100 };
  });
}
