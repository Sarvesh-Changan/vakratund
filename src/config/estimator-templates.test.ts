import { describe, expect, it } from "vitest";
import { calculateEstimate } from "@/server/estimator/calculate";
import { estimatorTemplates } from "./estimator-templates";

describe("estimator templates", () => {
  it("starts every template with an explicit placeholder rate and valid configuration", () => {
    expect(estimatorTemplates).toHaveLength(4);
    for (const template of estimatorTemplates) {
      expect(template.config.description).toContain("PLACEHOLDER");
      expect(template.config.fields.every((field) => field.label.trim())).toBe(true);
      if (template.config.pricingMode === "INSPECTION_ONLY") expect(calculateEstimate(template.config, {}).low).toBeNull();
    }
  });
});
