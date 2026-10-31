import type { EstimatorConfig } from "../types";

const inspection = ["pmc-turnkey-project-development", "redevelopment-project-management", "structural-repairs-rehabilitation", "piling-foundation", "plumbing-drainage", "road-works"];
const seededServices = [
  ["building-construction", "Building Construction", ["rcc-works", "brick-block-work", "plaster"]],
  ["pmc-turnkey-project-development", "PMC & Turnkey Project Development", []],
  ["redevelopment-project-management", "Redevelopment Project Management", []],
  ["structural-repairs-rehabilitation", "Structural Repairs & Rehabilitation", []],
  ["piling-foundation", "Piling Work & Foundation", []],
  ["waterproofing-solutions", "Waterproofing Solutions", ["crack-treatment", "pressure-injection-grouting", "parapet-coating"]],
  ["damp-proofing", "Damp Proofing", ["plinth-treatment"]],
  ["painting-works", "Painting Works", ["raincoat-parapet", "building-facades"]],
  ["plumbing-drainage", "Plumbing & Drainage Works", []],
  ["interior-works", "Interior Works", ["tv-units", "kitchens", "false-ceilings-cove-lighting", "partitions", "wooden-paneling"]],
  ["road-works", "Road Works", []],
  ["fabrication-porta-house", "Fabrication Work & Porta House", ["porta-house", "chain-link-fencing"]],
] as const;

export const seededEstimatorConfigs: EstimatorConfig[] = seededServices.map(([slug, name, extras]) => {
  const isInspection = inspection.includes(slug);
  const select = (key: string, label: string, values: readonly string[], required: boolean, sortOrder: number, advanced = false) => ({ key, label, type: (key === "add-ons" ? "MULTISELECT" : "RADIO") as "RADIO" | "MULTISELECT", required, isAdvanced: advanced, sortOrder, min: null, max: null, effectType: "NONE" as const, effectValue: null, options: values.map((value, optionIndex) => ({ value, label: value, effectType: "NONE" as const, effectValue: null, sortOrder: optionIndex })) });
  const fields = [
    { key: "area", label: "Project area (sq ft)", type: "NUMBER" as const, required: true, sortOrder: 0, min: 100, max: 100000, step: 100, defaultValue: "800", presetValues: [600, 800, 1200, 1500], unitLabel: "sq ft", effectType: "NONE" as const, effectValue: null, options: [] },
    { key: "floors", label: "Number of floors", type: "NUMBER" as const, required: false, sortOrder: 1, min: 1, max: 100, step: 1, defaultValue: "1", unitLabel: "floors", effectType: "NONE" as const, effectValue: null, options: [] },
    select("location", "Project location", ["thane", "mumbai-suburbs", "navi-mumbai", "outside-mmr"], false, 2),
    ...(isInspection ? [select("issue", "What do you need help with?", ["survey-or-audit", "repair-or-strengthening", "new-project-or-planning", "other-requirement"], true, 3)] : [select("specification", "Specification level", ["standard", "premium"], true, 3), select("add-ons", "Optional extras", extras, false, 4, true)]),
  ];
  return { serviceId: `seed-estimator-${slug}`, slug, name, pricingMode: isInspection ? "INSPECTION_ONLY" : "ESTIMATE", unit: "SQFT", areaFieldKey: "area", baseRate: 0, minCharge: 0, minArea: 100, maxArea: 100000, spreadPercent: 0, roundTo: 100, disclaimer: "Indicative estimate. Final quotation after site inspection.", version: 1, fields, rules: [], locationZones: ["thane", "mumbai-suburbs", "navi-mumbai", "outside-mmr"].map((zone, sortOrder) => ({ id: `seed-zone-${zone}`, name: zone, keywords: [zone], multiplierPct: 0, sortOrder })) };
});

export function seededAnswerSets(config: EstimatorConfig): Array<Record<string, number | string | string[]>> {
  const areaPoints = [100, 101, 600, 800, 1200, 1500, 99999, 100000];
  const optionFields = config.fields.filter((field) => field.type === "RADIO");
  return Array.from({ length: 40 }, (_, index) => {
    const answers: Record<string, number | string | string[]> = { area: areaPoints[index % areaPoints.length]!, floors: (index % 10) + 1, location: ["thane", "mumbai-suburbs", "navi-mumbai", "outside-mmr"][index % 4]! };
    for (const field of optionFields) {
      const option = field.options[index % Math.max(field.options.length, 1)];
      if (option) answers[field.key] = option.value;
    }
    const extras = config.fields.find((field) => field.key === "add-ons");
    if (extras) answers["add-ons"] = index % 2 && extras.options.length ? [extras.options[Math.floor(index / 2) % extras.options.length]!.value] : [];
    return answers;
  });
}

export const seededServiceCount = seededServices.length;
