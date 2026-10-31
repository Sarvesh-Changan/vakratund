import type { Condition } from "../types";

export type SimpleCondition = { field: string; operator: "equals" | "notEquals" | "gte" | "lte" | "in"; value: string | number | boolean };

const operatorText: Record<SimpleCondition["operator"], string> = { equals: "is", notEquals: "is not", gte: "is at least", lte: "is at most", in: "is any of" };

export function conditionToSentence(condition: SimpleCondition, fieldLabel: string, answerLabel?: (value: SimpleCondition["value"]) => string): string {
  const value = answerLabel ? answerLabel(condition.value) : String(condition.value);
  return `If ${fieldLabel} ${operatorText[condition.operator]} ${value}`;
}

export function sentenceToCondition(condition: SimpleCondition): SimpleCondition { return { ...condition }; }

export function simpleConditionFromTree(condition: Condition): SimpleCondition | null {
  const leaf = "all" in condition || "any" in condition ? null : condition;
  if (!leaf) return null;
  const supported = ["equals", "notEquals", "gte", "lte", "in"] as const;
  const matches = supported.filter((operator) => leaf[operator] !== undefined);
  if (matches.length !== 1) return null;
  const operator = matches[0]!;
  const raw = leaf[operator];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined || Array.isArray(value)) return null;
  return { field: leaf.field, operator, value };
}

export function conditionToReadable(condition: Condition, fieldLabel: (key: string) => string): string {
  if ("all" in condition) return condition.all.map((item) => conditionToReadable(item, fieldLabel)).join(" and ");
  if ("any" in condition) return condition.any.map((item) => conditionToReadable(item, fieldLabel)).join(" or ");
  const clauses: string[] = [];
  const valueText = (value: unknown) => Array.isArray(value) ? value.map(String).join(", ") : String(value);
  if (condition.equals !== undefined) clauses.push(`is ${valueText(condition.equals)}`);
  if (condition.notEquals !== undefined) clauses.push(`is not ${valueText(condition.notEquals)}`);
  if (condition.in !== undefined) clauses.push(`is any of ${valueText(condition.in)}`);
  if (condition.notIn !== undefined) clauses.push(`is none of ${valueText(condition.notIn)}`);
  if (condition.gt !== undefined) clauses.push(`is more than ${condition.gt}`);
  if (condition.gte !== undefined) clauses.push(`is at least ${condition.gte}`);
  if (condition.lt !== undefined) clauses.push(`is less than ${condition.lt}`);
  if (condition.lte !== undefined) clauses.push(`is at most ${condition.lte}`);
  return `${fieldLabel(condition.field)} ${clauses.join(" and ")}`;
}
