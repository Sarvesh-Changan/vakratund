import { conditionMatches } from "./conditions";
import type { Answers, EstimatorConfig, Field, FieldError, Option, ValidationResult } from "./types";

function isEmpty(value: Answers[string]): boolean {
  return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
}

function fieldError(field: string, code: FieldError["code"], message: string): FieldError {
  return { field, code, message };
}

function activeOptions(field: Field): Option[] {
  return field.options.filter((option) => option.isActive !== false);
}

function validateOptionValue(field: Field, value: Answers[string], errors: FieldError[]): void {
  const allowed = new Set(activeOptions(field).map((option) => option.value));
  if (field.type === "MULTISELECT") {
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
      errors.push(fieldError(field.key, "TYPE", "Choose one or more valid options."));
      return;
    }
    if (new Set(value).size !== value.length) errors.push(fieldError(field.key, "DUPLICATE", "An option was selected more than once."));
    if (value.some((item) => !allowed.has(item))) errors.push(fieldError(field.key, "OPTION", "Choose only active options."));
    return;
  }
  if (typeof value !== "string" || !allowed.has(value)) errors.push(fieldError(field.key, "OPTION", "Choose a valid active option."));
}

function validateField(field: Field, value: Answers[string], errors: FieldError[]): void {
  if (isEmpty(value)) {
    if (field.required && field.isAdvanced !== true) errors.push(fieldError(field.key, "REQUIRED", `${field.label} is required.`));
    return;
  }
  if (field.type === "NUMBER") {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      errors.push(fieldError(field.key, "TYPE", `${field.label} must be a finite number.`));
      return;
    }
    if (field.min !== null && value < field.min) errors.push(fieldError(field.key, "MIN", `${field.label} must be at least ${field.min}.`));
    if (field.max !== null && value > field.max) errors.push(fieldError(field.key, "MAX", `${field.label} must be at most ${field.max}.`));
    return;
  }
  if (field.type === "BOOLEAN") {
    if (typeof value !== "boolean") errors.push(fieldError(field.key, "TYPE", `${field.label} must be true or false.`));
    return;
  }
  if (["SELECT", "RADIO", "MULTISELECT"].includes(field.type)) validateOptionValue(field, value, errors);
}

export function visibleFields(config: EstimatorConfig, answers: Answers): Field[] {
  return config.fields.filter((field) => field.isActive !== false && conditionMatches(field.showIf, answers));
}

export function validateAnswers(config: EstimatorConfig, answers: Answers): ValidationResult {
  const errors: FieldError[] = [];
  const fields = config.fields.filter((field) => field.isActive !== false);
  const knownKeys = new Set(fields.map((field) => field.key));
  for (const key of Object.keys(answers)) {
    if (!knownKeys.has(key)) errors.push(fieldError(key, "UNKNOWN_FIELD", "This field is not part of the active estimator configuration."));
  }
  for (const field of visibleFields(config, answers)) validateField(field, answers[field.key], errors);

  const area = answers[config.areaFieldKey];
  if (typeof area === "number" && Number.isFinite(area)) {
    if (area < config.minArea) errors.push(fieldError(config.areaFieldKey, "MIN", `Area must be at least ${config.minArea}.`));
    if (area > config.maxArea) errors.push(fieldError(config.areaFieldKey, "MAX", `Area must be at most ${config.maxArea}.`));
  }
  return { valid: errors.length === 0, errors };
}
