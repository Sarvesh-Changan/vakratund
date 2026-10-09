import { describe, expect, it } from "vitest";
import { conditionMatches } from "./conditions";

describe("conditionMatches", () => {
  it.each([
    ["equals scalar", { field: "kind", equals: "premium" }, { kind: "premium" }, true],
    ["equals array answer", { field: "tags", equals: "premium" }, { tags: ["standard", "premium"] }, true],
    ["not equals", { field: "kind", notEquals: "basic" }, { kind: "premium" }, true],
    ["in", { field: "kind", in: ["premium", "basic"] }, { kind: "premium" }, true],
    ["not in", { field: "kind", notIn: ["basic"] }, { kind: "premium" }, true],
    ["greater than", { field: "area", gt: 100 }, { area: 101 }, true],
    ["greater than or equal", { field: "area", gte: 100 }, { area: 100 }, true],
    ["less than", { field: "area", lt: 100 }, { area: 99 }, true],
    ["less than or equal", { field: "area", lte: 100 }, { area: 100 }, true],
    ["failed comparison", { field: "area", gt: 100 }, { area: 100 }, false],
    ["all", { all: [{ field: "kind", equals: "premium" }, { field: "area", gte: 100 }] }, { kind: "premium", area: 100 }, true],
    ["any", { any: [{ field: "kind", equals: "premium" }, { field: "area", gt: 1000 }] }, { kind: "basic", area: 100 }, false],
    ["missing condition", undefined, {}, true],
  ] as const)("evaluates %s", (_name, condition, answers, expected) => expect(conditionMatches(condition, answers)).toBe(expected));

  it("fails all and any groups when they are empty", () => {
    expect(conditionMatches({ all: [] }, {})).toBe(false);
    expect(conditionMatches({ any: [] }, {})).toBe(false);
  });

  it("fails numeric comparisons for non-numeric answers", () => expect(conditionMatches({ field: "area", gte: 1 }, { area: "1" })).toBe(false));

  it("fails a condition with no operators", () => expect(conditionMatches({ field: "area" }, { area: 1 })).toBe(false));
});
