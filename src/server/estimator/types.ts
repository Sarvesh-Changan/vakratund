export type PricingMode = "ESTIMATE" | "INSPECTION_ONLY";
export type AreaUnit = "SQFT" | "RFT" | "UNIT" | "LUMPSUM";
export type FieldType = "SELECT" | "RADIO" | "NUMBER" | "BOOLEAN" | "MULTISELECT";
export type EffectType = "NONE" | "SET_BASE_RATE" | "ADD_PER_UNIT" | "ADD_FLAT" | "MULTIPLY_PERCENT";

export type AnswerScalar = string | number | boolean;
export type AnswerValue = AnswerScalar | readonly string[];
export type Answers = Record<string, AnswerValue | undefined>;

export type Condition =
  | { all: readonly Condition[] }
  | { any: readonly Condition[] }
  | { field: string; equals?: AnswerScalar | readonly AnswerScalar[]; notEquals?: AnswerScalar | readonly AnswerScalar[]; in?: readonly AnswerScalar[]; notIn?: readonly AnswerScalar[]; gt?: number; gte?: number; lt?: number; lte?: number };

export type Option = {
  value: string;
  label: string;
  description?: string | null;
  effectType: EffectType;
  effectValue: number | null;
  sortOrder: number;
  isActive?: boolean;
};

export type Field = {
  key: string;
  label: string;
  helpText?: string | null;
  shortHelp?: string | null;
  type: FieldType;
  required: boolean;
  isAdvanced?: boolean;
  sortOrder: number;
  min: number | null;
  max: number | null;
  step?: number | null;
  defaultValue?: string | null;
  presetValues?: number[];
  unitLabel?: string | null;
  showIf?: Condition;
  effectType: EffectType;
  effectValue: number | null;
  options: Option[];
  isActive?: boolean;
};

export type Rule = {
  id: string;
  name: string;
  order: number;
  condition: Condition;
  effectType: EffectType;
  effectValue: number;
  isActive?: boolean;
};

export type LocationZone = {
  id: string;
  name: string;
  keywords: string[];
  multiplierPct: number;
  sortOrder: number;
  isActive?: boolean;
};

export type EstimatorConfig = {
  serviceId: string;
  slug: string;
  name: string;
  description?: string | null;
  includedText?: string[];
  notIncludedText?: string[];
  pricingMode: PricingMode;
  unit: AreaUnit;
  areaFieldKey: string;
  baseRate: number;
  minCharge: number;
  minArea: number;
  maxArea: number;
  spreadPercent: number;
  roundTo: number;
  disclaimer?: string | null;
  version: number;
  fields: Field[];
  rules: Rule[];
  locationZones: LocationZone[];
};

export type FieldErrorCode = "REQUIRED" | "TYPE" | "MIN" | "MAX" | "OPTION" | "UNKNOWN_FIELD" | "DUPLICATE" | "INVALID";

export type FieldError = { field: string; code: FieldErrorCode; message: string };
export type ValidationResult = { valid: boolean; errors: FieldError[] };

export type BreakdownLineItem = {
  id: string;
  label: string;
  kind: "BASE" | "ADD_PER_UNIT" | "ADD_FLAT" | "RULE" | "PERCENT" | "LOCATION" | "MINIMUM";
  amount: number;
  detail?: string;
};

export type EstimateResult = {
  low: number | null;
  high: number | null;
  breakdown: BreakdownLineItem[];
  warnings: string[];
};
