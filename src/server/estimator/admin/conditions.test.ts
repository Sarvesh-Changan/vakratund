import { describe, expect, it } from "vitest";
import { conditionToSentence, simpleConditionFromTree, sentenceToCondition } from "./conditions";

describe("plain condition sentences", () => {
  it("round trips a supported condition through its sentence representation", () => {
    const condition = { field: "finish", operator: "equals" as const, value: "premium" };
    expect(sentenceToCondition(condition)).toEqual(condition);
    expect(conditionToSentence(condition, "Finish", () => "Premium")).toBe("If Finish is Premium");
  });
  it("offers conversion only for one equivalent comparison", () => {
    expect(simpleConditionFromTree({ field: "area", gte: 100 })).toEqual({ field: "area", operator: "gte", value: 100 });
    expect(simpleConditionFromTree({ all: [{ field: "area", gte: 100 }, { field: "area", lte: 1000 }] })).toBeNull();
    expect(simpleConditionFromTree({ any: [{ field: "finish", equals: "premium" }] })).toBeNull();
  });
});
