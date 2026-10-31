import type { EstimatorConfig } from "@/server/estimator/types";

export type EstimatorTemplateId = "area-packages" | "area-extras" | "quantity-units" | "inspection-first";
export type EstimatorTemplate = { id: EstimatorTemplateId; title: string; description: string; config: EstimatorConfig };

const area = { key: "area", label: "Project area", type: "NUMBER" as const, required: true, sortOrder: 0, min: 100, max: 100000, step: 100, defaultValue: "800", presetValues: [600, 800, 1200], unitLabel: "sq ft", effectType: "NONE" as const, effectValue: null, options: [] };
const choices = (key: string, label: string, options: EstimatorConfig["fields"][number]["options"], type: "RADIO" | "MULTISELECT" = "RADIO") => ({ key, label, type, required: type === "RADIO", isAdvanced: type === "MULTISELECT", sortOrder: 1, min: null, max: null, effectType: "NONE" as const, effectValue: null, options });
const option = (value: string, label: string, effectType: "SET_BASE_RATE" | "ADD_PER_UNIT" | "ADD_FLAT" | "MULTIPLY_PERCENT" = "ADD_PER_UNIT", effectValue = 0) => ({ value, label, description: "TODO(client): confirm approved price.", effectType, effectValue, sortOrder: 0 });

function templateConfig(id: EstimatorTemplateId, name: string, fields: EstimatorConfig["fields"], pricingMode: EstimatorConfig["pricingMode"] = "ESTIMATE", unit: EstimatorConfig["unit"] = "SQFT"): EstimatorConfig {
  return { serviceId: `template-${id}`, slug: id, name, description: "PLACEHOLDER rates — TODO(client): add the approved rate card before publishing.", includedText: [], notIncludedText: [], pricingMode, unit, areaFieldKey: "area", baseRate: 0, minCharge: 0, minArea: unit === "UNIT" ? 1 : 100, maxArea: 100000, spreadPercent: 10, roundTo: 100, disclaimer: "PLACEHOLDER rates. Indicative estimate; final quotation after site inspection.", version: 1, fields, rules: [], locationZones: [] };
}

export const estimatorTemplates: readonly EstimatorTemplate[] = [
  { id: "area-packages", title: "Priced by area with packages", description: "A starting price per sq ft with answer choices.", config: templateConfig("area-packages", "New area-based service", [area, choices("package", "Choose a package", [option("standard", "Standard package", "SET_BASE_RATE"), option("premium", "Premium package", "SET_BASE_RATE")])]) },
  { id: "area-extras", title: "Priced by area with extras", description: "A base price plus optional additions.", config: templateConfig("area-extras", "New service with optional extras", [area, choices("extras", "Optional extras", [option("extra-one", "Extra work", "ADD_FLAT")], "MULTISELECT")]) },
  { id: "quantity-units", title: "Priced by quantity (units)", description: "A number of items, each priced at a set amount.", config: templateConfig("quantity-units", "New quantity-based service", [{ ...area, label: "Number of units", unitLabel: "units", defaultValue: "1", min: 1, presetValues: [1, 5, 10] }], "ESTIMATE", "UNIT") },
  { id: "inspection-first", title: "Site inspection first", description: "Collect project details without showing a price.", config: templateConfig("inspection-first", "New service requiring inspection", [choices("work-needed", "What do you need help with?", [option("review", "Review my project", "ADD_FLAT")])], "INSPECTION_ONLY") },
];
