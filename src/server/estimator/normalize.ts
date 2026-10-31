import type { EstimatorConfig } from "./types";

/** Removes only data that the current engine demonstrably ignores. */
export function normalizeEstimatorConfig(config: EstimatorConfig): EstimatorConfig {
  return {
    ...config,
    fields: config.fields.map((field) => ({
      ...field,
      effectValue: field.effectType === "NONE" ? null : field.effectValue,
      options: field.options.map((option) => ({
        ...option,
        effectValue: option.effectType === "NONE" ? null : option.effectValue,
      })),
    })),
    rules: config.rules.filter((rule) => !("all" in rule.condition && rule.condition.all.length === 0) && !("any" in rule.condition && rule.condition.any.length === 0)),
  };
}
