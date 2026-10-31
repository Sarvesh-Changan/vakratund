import { describe, expect, it } from "vitest";
import { calculateEstimate } from "../calculate";
import { seededAnswerSets, seededEstimatorConfigs, seededServiceCount } from "./seeded-configs";
import goldens from "./goldens.json";

describe("seeded estimator golden totals", () => {
  it("keeps the captured low, high, and breakdown totals for 40 cases per seeded service", () => {
    expect(seededEstimatorConfigs).toHaveLength(seededServiceCount);
    for (const config of seededEstimatorConfigs) {
      const expected = goldens[config.slug as keyof typeof goldens];
      const answerSets = seededAnswerSets(config);
      expect(answerSets).toHaveLength(expected.cases);
      for (const answers of answerSets) {
        const result = calculateEstimate(config, answers);
        expect(result.low).toBe(expected.low);
        expect(result.high).toBe(expected.high);
        expect(result.breakdown.reduce((total, item) => total + item.amount, 0)).toBe(expected.breakdownTotal);
      }
    }
  });
});
