import type {
  Answers,
  BreakdownLineItem,
  EstimatorConfig,
  Field,
} from "./types";

export type BreakdownGroup = "WORK_COST" | "EXTRAS" | "LOCATION" | "OTHER";

export type DisplayBreakdownLine = {
  id: BreakdownGroup;
  label: string;
  amount: number;
  details: string[];
};

export function formatINR(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function groupFor(item: BreakdownLineItem): BreakdownGroup {
  if (item.kind === "LOCATION") return "LOCATION";
  if (item.kind === "RULE" || item.kind === "MINIMUM") return "OTHER";
  if (item.id.startsWith("option-")) return "EXTRAS";
  return "WORK_COST";
}

const labels: Record<BreakdownGroup, string> = {
  WORK_COST: "Work cost",
  EXTRAS: "Extras",
  LOCATION: "Location adjustment",
  OTHER: "Other adjustments",
};

export function groupBreakdown(
  items: readonly BreakdownLineItem[],
): DisplayBreakdownLine[] {
  const groups = new Map<BreakdownGroup, DisplayBreakdownLine>();
  for (const item of items) {
    const id = groupFor(item);
    const current = groups.get(id) ?? {
      id,
      label: labels[id],
      amount: 0,
      details: [],
    };
    current.amount += item.amount;
    if (item.detail) current.details.push(item.detail);
    groups.set(id, current);
  }
  return [...groups.values()];
}

function numberDefault(
  field: Field,
  config: EstimatorConfig,
): number | undefined {
  const configured = field.defaultValue ? Number(field.defaultValue) : NaN;
  if (Number.isFinite(configured)) return configured;
  if (field.presetValues && field.presetValues.length > 0)
    return field.presetValues[Math.floor(field.presetValues.length / 2)];
  if (field.key === config.areaFieldKey) return config.minArea;
  if (field.min !== null && field.max !== null)
    return Math.round((field.min + field.max) / 2);
  return undefined;
}

export function initialAnswers(config: EstimatorConfig): Answers {
  const answers: Answers = {};
  for (const field of config.fields.filter((item) => item.isActive !== false)) {
    if (field.type === "NUMBER") {
      const value = numberDefault(field, config);
      if (value !== undefined) answers[field.key] = value;
    } else if (field.type === "SELECT" || field.type === "RADIO") {
      const configured =
        field.defaultValue &&
        field.options.some((option) => option.value === field.defaultValue)
          ? field.defaultValue
          : field.options[Math.floor(field.options.length / 2)]?.value;
      if (configured) answers[field.key] = configured;
    } else if (field.type === "BOOLEAN") {
      answers[field.key] = field.defaultValue === "true";
    }
  }
  return answers;
}

export function selectedLabel(field: Field, value: unknown): string {
  if (Array.isArray(value))
    return value
      .map(
        (item) =>
          field.options.find((option) => option.value === item)?.label ?? "",
      )
      .filter(Boolean)
      .join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number")
    return `${value}${field.unitLabel ? ` ${field.unitLabel}` : ""}`;
  if (typeof value === "string")
    return (
      field.options.find((option) => option.value === value)?.label ??
      "Not selected"
    );
  return "Not selected";
}
