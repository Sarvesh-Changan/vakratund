import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { estimatorVocabulary } from "./estimator-vocabulary";

describe("estimator vocabulary", () => {
  it("provides plain-language help for every stored choice", () => {
    for (const group of [estimatorVocabulary.effects, estimatorVocabulary.fields, estimatorVocabulary.pricingModes])
      for (const item of Object.values(group)) {
        expect(item.label).not.toMatch(/^(SET_BASE_RATE|ADD_PER_UNIT|ADD_FLAT|MULTIPLY_PERCENT|NONE|SELECT|RADIO|NUMBER|BOOLEAN|MULTISELECT|ESTIMATE|INSPECTION_ONLY)$/);
        expect(item.help.length).toBeGreaterThan(10);
      }
  });

  it("does not interpolate raw pricing enums into admin UI labels", () => {
    const root = join(process.cwd(), "src/components/admin");
    const files = readdirSync(root).filter((file) => /\.tsx?$/.test(file));
    const source = files.map((file) => readFileSync(join(root, file), "utf8")).join("\n");
    expect(source).not.toMatch(/>\s*\{\s*\w+\.(?:effectType|pricingMode|type)\s*\}\s*</);
    expect(source).not.toMatch(/>\s*\{\s*(?:effect|operator|type)\s*\}\s*</);
    for (const raw of ["SET_BASE_RATE", "ADD_PER_UNIT", "ADD_FLAT", "MULTIPLY_PERCENT", "INSPECTION_ONLY", "MULTISELECT"])
      expect(source).not.toMatch(new RegExp(`>\\s*${raw}\\s*<`));
  });
});
