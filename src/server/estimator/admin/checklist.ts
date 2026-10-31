import type { EstimatorConfig } from "../types";

export type ChecklistItem = { status: "ready" | "advice" | "fix"; title: string; advice: string };

export function estimatorChecklist(config: EstimatorConfig): ChecklistItem[] {
  const choiceFields = config.fields.filter((field) => field.isActive !== false && ["SELECT", "RADIO", "MULTISELECT"].includes(field.type));
  const labels = config.fields.filter((field) => field.isActive !== false).flatMap((field) => [field.label, ...field.options.map((option) => option.label)]).map((label) => label.trim().toLocaleLowerCase()).filter(Boolean);
  const hasDuplicate = new Set(labels).size !== labels.length;
  const placeholders = config.pricingMode === "ESTIMATE" && (config.baseRate <= 0 || config.fields.some((field) => field.isActive !== false && field.effectType !== "NONE" && (field.effectValue ?? 0) === 0) || config.fields.some((field) => field.options.some((option) => option.effectType !== "NONE" && (option.effectValue ?? 0) === 0)));
  return [
    { status: config.pricingMode === "INSPECTION_ONLY" || config.baseRate > 0 ? "ready" : "advice", title: "Base price", advice: config.pricingMode === "INSPECTION_ONLY" ? "No online price is used for inspection-first services." : "Enter the approved price per unit." },
    { status: config.minCharge <= config.baseRate * Math.max(config.minArea, 1) || config.pricingMode === "INSPECTION_ONLY" ? "ready" : "advice", title: "Minimum charge", advice: "Check that the minimum charge is below a typical project total." },
    { status: config.minArea <= config.maxArea && config.maxArea > 0 ? "ready" : "fix", title: "Area limits", advice: "The maximum must be at least the minimum." },
    { status: config.fields.some((field) => field.isActive !== false && !field.isAdvanced) ? "ready" : "advice", title: "Main questions", advice: "Add at least one question to guide visitors." },
    { status: choiceFields.every((field) => field.options.length >= 2) ? "ready" : "advice", title: "Answer choices", advice: "Give each choice question two or more answers." },
    { status: config.fields.some((field) => field.isActive !== false && !field.label.trim()) ? "fix" : "ready", title: "Question labels", advice: "Every question needs a visitor-friendly label." },
    { status: hasDuplicate ? "fix" : "ready", title: "Unique labels", advice: "Use a different label for each question and answer." },
    { status: placeholders ? "advice" : "ready", title: "Placeholder prices", advice: placeholders ? "Replace placeholder amounts with client-approved prices before publishing." : "No placeholder price was found." },
    { status: "ready", title: "Location row", advice: "A default 0% row applies when no named location matches." },
    { status: config.disclaimer?.trim() ? "ready" : "advice", title: "Disclaimer", advice: "Explain that the final quotation follows a site inspection." },
  ];
}
