import type { AnswerScalar, Answers, Condition } from "./types";

function scalarEqual(left: AnswerScalar | undefined, right: AnswerScalar): boolean {
  return left === right;
}

function valueMatches(value: Answers[string], expected: AnswerScalar | readonly AnswerScalar[] | undefined): boolean {
  if (expected === undefined) return true;
  const expectedValues = Array.isArray(expected) ? expected : [expected];
  if (Array.isArray(value)) return value.some((item) => expectedValues.some((expectedValue) => scalarEqual(item, expectedValue)));
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return expectedValues.some((expectedValue) => scalarEqual(value, expectedValue));
  return false;
}

function numericValue(value: Answers[string]): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

export function conditionMatches(condition: Condition | undefined, answers: Answers): boolean {
  if (!condition) return true;
  if ("all" in condition) return condition.all.length > 0 && condition.all.every((item) => conditionMatches(item, answers));
  if ("any" in condition) return condition.any.length > 0 && condition.any.some((item) => conditionMatches(item, answers));

  const value = answers[condition.field];
  const hasOperator = [condition.equals, condition.notEquals, condition.in, condition.notIn, condition.gt, condition.gte, condition.lt, condition.lte].some((item) => item !== undefined);
  if (!hasOperator) return false;
  if (condition.equals !== undefined && !valueMatches(value, condition.equals)) return false;
  if (condition.notEquals !== undefined && valueMatches(value, condition.notEquals)) return false;
  if (condition.in !== undefined && !valueMatches(value, condition.in)) return false;
  if (condition.notIn !== undefined && valueMatches(value, condition.notIn)) return false;
  const numeric = numericValue(value);
  if (condition.gt !== undefined && (numeric === null || numeric <= condition.gt)) return false;
  if (condition.gte !== undefined && (numeric === null || numeric < condition.gte)) return false;
  if (condition.lt !== undefined && (numeric === null || numeric >= condition.lt)) return false;
  if (condition.lte !== undefined && (numeric === null || numeric > condition.lte)) return false;
  return Object.keys(condition).length > 0;
}
