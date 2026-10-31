"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Button,
  Card,
  Checkbox,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { estimatorChecklist } from "@/server/estimator/admin/checklist";
import { conditionToReadable } from "@/server/estimator/admin/conditions";
import { estimatorImpactPreview } from "@/server/estimator/admin/impact";
import { estimatorVocabulary, effectLabel, fieldTypeLabel, pricingModeLabel } from "@/config/estimator-vocabulary";
import type { Condition, EstimatorConfig } from "@/server/estimator/types";
import type {
  EstimatorAdminData,
  EstimatorAdminService,
} from "@/server/services/estimator-admin";
import {
  saveEstimatorService,
  saveLocationZones,
  createEstimatorFromTemplate,
  duplicateEstimatorService,
} from "@/app/(admin)/admin/(protected)/estimator/actions";
import { estimatorTemplates, type EstimatorTemplateId } from "@/config/estimator-templates";

type AdminService = EstimatorAdminService;
type AdminField = AdminService["fields"][number];
type AdminOption = AdminField["options"][number];
type AdminRule = AdminService["rules"][number];
type Clause = NonNullable<AdminField["showIf"]>;
type PriceChange = AdminField["effectType"];

function PriceChangeHelp({ type }: { type: PriceChange }) {
  return <p className="text-xs font-normal text-ink-muted">{estimatorVocabulary.effects[type].help}</p>;
}
function AnswerFormatHelp({ type }: { type: AdminField["type"] }) {
  return <p className="text-xs font-normal text-ink-muted">{estimatorVocabulary.fields[type].help}</p>;
}

const effectTypes = [
  "NONE",
  "SET_BASE_RATE",
  "ADD_PER_UNIT",
  "ADD_FLAT",
  "MULTIPLY_PERCENT",
] as const;
const operators = [
  "equals",
  "notEquals",
  "in",
  "notIn",
  "gt",
  "gte",
  "lt",
  "lte",
] as const;
const operatorLabels: Record<(typeof operators)[number], string> = { equals: "is", notEquals: "is not", in: "is any of", notIn: "is none of", gt: "is greater than", gte: "is at least", lt: "is less than", lte: "is at most" };

function newOption(sortOrder: number): AdminOption {
  return {
    value: "",
    label: "",
    description: null,
    effectType: "NONE",
    effectValue: null,
    sortOrder,
    isActive: true,
  };
}
function newField(sortOrder: number): AdminField {
  return {
    key: `field_${sortOrder + 1}`,
    label: "New visitor question",
    helpText: null,
    shortHelp: null,
    type: "NUMBER",
    required: false,
    isAdvanced: false,
    sortOrder,
    min: null,
    max: null,
    step: null,
    defaultValue: null,
    presetValues: [],
    unitLabel: null,
    showIf: null,
    effectType: "NONE",
    effectValue: null,
    options: [],
    isActive: true,
  };
}
function newClause(): Clause {
  return { field: "", operator: "equals", value: "" };
}
function newRule(order: number): AdminRule {
  return {
    id: undefined,
    name: "New special condition",
    order,
    condition: { all: [newClause()] },
    effectType: "ADD_FLAT",
    effectValue: 0,
    isActive: true,
  };
}
function estimatorServicePayload(service: AdminService) {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    isActive: service.isActive,
    pricingMode: service.pricingMode,
    unit: service.unit,
    baseRate: service.baseRate,
    minCharge: service.minCharge,
    minArea: service.minArea,
    maxArea: service.maxArea,
    spreadPercent: service.spreadPercent,
    roundTo: service.roundTo,
    sortOrder: service.sortOrder,
    disclaimer: service.disclaimer,
    includedText: service.includedText.map((item) => item.trim()).filter(Boolean),
    notIncludedText: service.notIncludedText.map((item) => item.trim()).filter(Boolean),
    fields: service.fields,
    rules: service.rules,
  };
}

function toCondition(clause: Clause): Condition {
  return {
    [clause.operator]:
      clause.operator === "in" || clause.operator === "notIn"
        ? [clause.value]
        : clause.value,
    field: clause.field,
  } as Condition;
}
function toConfig(
  service: AdminService,
  zones: EstimatorAdminData["zones"],
): EstimatorConfig {
  return {
    serviceId: service.id,
    slug: service.slug,
    name: service.name,
    pricingMode: service.pricingMode,
    unit: service.unit,
    areaFieldKey: "area",
    baseRate: service.baseRate,
    minCharge: service.minCharge,
    minArea: service.minArea,
    maxArea: service.maxArea,
    spreadPercent: service.spreadPercent,
    roundTo: service.roundTo,
    disclaimer: service.disclaimer,
    includedText: service.includedText,
    notIncludedText: service.notIncludedText,
    version: 1,
    fields: service.fields
      .filter((field) => field.isActive)
      .map((field) => ({
        ...field,
        showIf: field.advancedShowIf ?? (field.showIf ? toCondition(field.showIf) : undefined),
        options: field.options,
      })),
    rules: service.rules
      .filter((rule) => rule.isActive)
      .map((rule, index) => ({
        ...rule,
        id: rule.id ?? `${service.id}-rule-${index}`,
        condition: rule.advancedCondition ?? { all: rule.condition.all.map(toCondition) },
      })),
    locationZones: zones
      .filter((zone) => zone.isActive)
      .map((zone) => ({
        id: zone.id ?? "",
        name: zone.name,
        keywords: zone.keywords,
        multiplierPct: zone.multiplierPct,
        sortOrder: zone.sortOrder,
        isActive: zone.isActive,
      })),
  };
}

function ValueControl({
  field,
  value,
  onChange,
}: {
  field: AdminField | undefined;
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
}) {
  if (!field)
    return (
      <Input
        value={String(value)}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  if (field.type === "BOOLEAN")
    return (
      <Select
        value={String(value)}
        onChange={(event) => onChange(event.target.value === "true")}
      >
        <option value="true">True</option>
        <option value="false">False</option>
      </Select>
    );
  if (field.type === "NUMBER")
    return (
      <Input
        type="number"
        value={String(value)}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    );
  return (
    <Select
      value={String(value)}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">Choose value</option>
      {field.options
        .filter((option) => option.isActive)
        .map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
    </Select>
  );
}

function ClauseEditor({
  clause,
  fields,
  onChange,
  onRemove,
}: {
  clause: Clause;
  fields: AdminField[];
  onChange: (value: Clause) => void;
  onRemove?: () => void;
}) {
  const selected = fields.find((field) => field.key === clause.field);
  return (
    <div className="grid gap-2 rounded-control border bg-surface-alt p-3 sm:grid-cols-[1.2fr_1fr_1.2fr_auto]">
      <Select
        aria-label="Condition field"
        value={clause.field}
        onChange={(event) =>
          onChange({ ...clause, field: event.target.value, value: "" })
        }
      >
        <option value="">Choose field</option>
        {fields
          .filter((field) => field.isActive)
          .map((field) => (
            <option key={field.key} value={field.key}>
              {field.label}
            </option>
          ))}
      </Select>
      <Select
        aria-label="Condition operator"
        value={clause.operator}
        onChange={(event) =>
          onChange({
            ...clause,
            operator: event.target.value as Clause["operator"],
          })
        }
      >
        {operators.map((operator) => (
          <option key={operator} value={operator}>
            {operatorLabels[operator]}
          </option>
        ))}
      </Select>
      <ValueControl
        field={selected}
        value={clause.value}
        onChange={(value) => onChange({ ...clause, value })}
      />
      {onRemove ? (
        <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
          Remove
        </Button>
      ) : null}
    </div>
  );
}

function OptionEditor({
  option,
  onChange,
  onRemove,
}: {
  option: AdminOption;
  onChange: (option: AdminOption) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid gap-2 rounded-control border p-3 sm:grid-cols-[1fr_1fr_1.2fr_9rem_8rem_auto]">
      <Input
        aria-label="Option value"
        placeholder="value"
        value={option.value}
        onChange={(event) => onChange({ ...option, value: event.target.value })}
      />
      <Input
        aria-label="Option label"
        placeholder="Label"
        value={option.label}
        onChange={(event) => onChange({ ...option, label: event.target.value })}
      />
      <Input
        aria-label="Option description"
        placeholder="Description"
        value={option.description ?? ""}
        onChange={(event) =>
          onChange({ ...option, description: event.target.value })
        }
      />
      <Select
        aria-label="Option price change"
        value={option.effectType}
        onChange={(event) =>
          onChange({
            ...option,
            effectType: event.target.value as AdminOption["effectType"],
          })
        }
      >
        {effectTypes.map((effect) => (
          <option key={effect} value={effect}>
            {effectLabel(effect)}
          </option>
        ))}
      </Select>
      <p className="text-xs text-ink-muted sm:col-span-full">{estimatorVocabulary.effects[option.effectType].help}</p>
      <Input
        aria-label="Option price change amount"
        type="number"
        value={option.effectValue ?? ""}
        onChange={(event) =>
          onChange({
            ...option,
            effectValue:
              event.target.value === "" ? null : Number(event.target.value),
          })
        }
      />
      <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
}

function ServiceEditor({
  initial,
  zones,
  initialZones,
}: {
  initial: AdminService;
  zones: EstimatorAdminData["zones"];
  initialZones: EstimatorAdminData["zones"];
}) {
  const [service, setService] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fields = service.fields;
  const placeholder =
    service.baseRate <= 0 ||
    fields.some(
      (field) =>
        field.isActive &&
        field.effectType !== "NONE" &&
        field.effectValue === null,
    ) ||
    fields.some((field) =>
      field.options.some(
        (option) =>
          option.isActive &&
          option.effectType !== "NONE" &&
          option.effectValue === null,
      ),
    );
  const checklist = useMemo(() => estimatorChecklist(toConfig(service, zones)), [service, zones]);
  const checklistHasErrors = checklist.some((item) => item.status === "fix");
  const impacts = useMemo(() => estimatorImpactPreview(toConfig(initial, initialZones), toConfig(service, zones)), [initial, initialZones, service, zones]);
  const changedImpacts = impacts.filter((item) => item.changed);
  const largestChange = Math.max(0, ...changedImpacts.map((item) => Math.abs(item.changePercent)));
  const set = <K extends keyof AdminService>(key: K, value: AdminService[K]) =>
    setService((current) => ({ ...current, [key]: value }));
  const updateField = (index: number, value: AdminField) =>
    set(
      "fields",
      fields.map((field, fieldIndex) => (fieldIndex === index ? value : field)),
    );
  const updateRule = (index: number, value: AdminRule) =>
    set(
      "rules",
      service.rules.map((rule, ruleIndex) =>
        ruleIndex === index ? value : rule,
      ),
    );

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await saveEstimatorService(estimatorServicePayload(service));
      setMessage(
        response.ok
          ? `Saved. Estimator version is now ${response.data.version}.`
          : response.error.message,
      );
    } catch {
      setMessage("The estimator could not be saved. No changes were applied.");
    } finally {
      setSaving(false);
    }
  }
  const saveControl = changedImpacts.length ? <ConfirmDialog title="Save these price changes?" description={`${changedImpacts.length} of ${impacts.length} sample prices change. The largest change is ${largestChange.toFixed(1)}%. Existing quotes keep their saved figures.`} confirmLabel="Save changes" onConfirm={save}><Button type="button" loading={saving}>Save changes</Button></ConfirmDialog> : <Button type="button" loading={saving} onClick={() => void save()}>Save changes</Button>;

  function moveField(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= fields.length) return;
    const reordered = [...fields];
    const current = reordered[index];
    const neighbor = reordered[next];
    if (!current || !neighbor) return;
    reordered[index] = neighbor;
    reordered[next] = current;
    set(
      "fields",
      reordered.map((field, fieldIndex) => ({
        ...field,
        sortOrder: fieldIndex,
      })),
    );
  }
  function moveRule(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= service.rules.length) return;
    const reordered = [...service.rules];
    const current = reordered[index];
    const neighbor = reordered[next];
    if (!current || !neighbor) return;
    reordered[index] = neighbor;
    reordered[next] = current;
    set(
      "rules",
      reordered.map((rule, ruleIndex) => ({ ...rule, order: ruleIndex })),
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-heading text-xl font-semibold">1. Basics</h2>
        <p className="mt-2 text-sm text-ink-muted">{service.pricingMode === "INSPECTION_ONLY" ? `Visitors answer a few questions and request a site inspection for ${service.name}. No online price is shown.` : `Visitors get a price range for ${service.name}. Base price ₹${service.baseRate.toLocaleString("en-IN")} per ${estimatorVocabulary.units[service.unit]}, minimum job ₹${service.minCharge.toLocaleString("en-IN")}, shown as plus or minus ${service.spreadPercent}%.`}</p>
        <label className="mt-4 block text-sm font-semibold">Service name<Input className="mt-1" value={service.name} onChange={(event) => set("name", event.target.value)} /></label>
        <label className="mt-3 block text-sm font-semibold">Short description<Textarea className="mt-1" rows={2} value={service.description ?? ""} onChange={(event) => set("description", event.target.value || null)} /></label>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="text-sm font-semibold"><span className="block">Visitor visibility</span>{service.isActive ? <ConfirmDialog title="Hide this service from visitors?" description="Turning this off hides the service from visitors. Existing quotes are not affected." confirmLabel="Hide service" onConfirm={() => set("isActive", false)}><Button type="button" variant="secondary" className="mt-1">Turn off service</Button></ConfirmDialog> : <Button type="button" variant="secondary" className="mt-1" disabled={checklistHasErrors} aria-describedby="estimator-publish-checklist" onClick={() => set("isActive", true)}>Show service to visitors</Button>}</div>
          <label className="text-sm font-semibold">Display order<Input className="mt-1" type="number" min="0" value={service.sortOrder} onChange={(event) => set("sortOrder", Number(event.target.value))} /></label>
          <label className="text-sm font-semibold">How visitors get a price<Select className="mt-1 w-full" value={service.pricingMode} onChange={(event) => set("pricingMode", event.target.value as AdminService["pricingMode"])}><option value="ESTIMATE">{pricingModeLabel("ESTIMATE")}</option><option value="INSPECTION_ONLY">{pricingModeLabel("INSPECTION_ONLY")}</option></Select><span className="mt-1 block text-xs font-normal text-ink-muted">{estimatorVocabulary.pricingModes[service.pricingMode].help}</span></label>
          <label className="text-sm font-semibold">Price unit<Select className="mt-1 w-full" value={service.unit} onChange={(event) => set("unit", event.target.value as AdminService["unit"])}>{(["SQFT", "RFT", "UNIT", "LUMPSUM"] as const).map((unit) => <option value={unit} key={unit}>{estimatorVocabulary.units[unit]}</option>)}</Select></label>
        </div>
      </Card>
      <details className="rounded-card border bg-surface p-4" id="estimator-publish-checklist">
        <summary className="cursor-pointer font-heading text-lg font-semibold">
          Ready-to-publish checklist <span className="text-sm font-normal text-ink-muted">({checklist.filter((item) => item.status === "ready").length} ready · {checklist.filter((item) => item.status === "advice").length} tips · {checklist.filter((item) => item.status === "fix").length} to fix)</span>
        </summary>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {checklist.map((item) => <li key={item.title} className="rounded-control border p-3 text-sm"><span className="font-semibold">{item.status === "ready" ? "Ready" : item.status === "fix" ? "Needs a fix" : "Advice"}: {item.title}</span><p className="mt-1 text-ink-muted">{item.advice}</p></li>)}
        </ul>
      </details>
      {placeholder ? (
        <div
          className="rounded-card border-2 border-warning bg-warning/10 p-4 text-sm text-ink"
          role="alert"
        >
          <strong>PLACEHOLDER prices:</strong> at least one active base price or answer price
          is zero or missing. Do not publish an estimate until
          client-approved rates are entered.
        </div>
      ) : null}
      {message ? (
        <p
          role="status"
          className="rounded-control border bg-surface-alt p-3 text-sm"
        >
          {message}
        </p>
      ) : null}
      {service.pricingMode === "ESTIMATE" ? <Card>
        <h2 className="mb-4 font-heading text-xl font-semibold">2. Price</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <label className="text-sm font-semibold">
            Base rate (₹)
            <Input
              className="mt-1 w-full"
              type="number"
              value={service.baseRate}
              onChange={(event) => set("baseRate", Number(event.target.value))}
            />
          </label>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-5">
          <label className="text-sm font-semibold">
            Minimum charge
            <Input
              className="mt-1 w-full"
              type="number"
              value={service.minCharge}
              onChange={(event) => set("minCharge", Number(event.target.value))}
            />
          </label>
          <label className="text-sm font-semibold">
            Spread %
            <Input
              className="mt-1 w-full"
              type="number"
              value={service.spreadPercent}
              onChange={(event) =>
                set("spreadPercent", Number(event.target.value))
              }
            />
          </label>
          <label className="text-sm font-semibold">
            Min area
            <Input
              className="mt-1 w-full"
              type="number"
              value={service.minArea}
              onChange={(event) => set("minArea", Number(event.target.value))}
            />
          </label>
          <label className="text-sm font-semibold">
            Max area
            <Input
              className="mt-1 w-full"
              type="number"
              value={service.maxArea}
              onChange={(event) => set("maxArea", Number(event.target.value))}
            />
          </label>
          <label className="text-sm font-semibold">
            Round to (₹)
            <Input
              className="mt-1 w-full"
              type="number"
              value={service.roundTo}
              onChange={(event) => set("roundTo", Number(event.target.value))}
            />
          </label>
        </div>
      </Card> : null}

      <Card>
        <h2 className="mb-4 font-heading text-xl font-semibold">3. Questions the visitor answers</h2>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-semibold">Questions</h2>
            <p className="text-sm text-ink-muted">
              Add only what visitors need to get a useful estimate. Keep the first questions short.
            </p>
            {fields.filter((field) => field.isActive && !field.isAdvanced).length > 5 ? <p className="mt-2 text-sm text-warning" role="status">More than five main questions may put visitors off.</p> : null}
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => set("fields", [...fields, newField(fields.length)])}
          >
            Add field
          </Button>
        </div>
        <div className="mt-5 space-y-4">
          {fields.map((field, index) => (
            <details
              key={`${field.key}-${index}`}
              className={`rounded-card border p-4 ${field.isActive ? "" : "opacity-60"}`}
            >
              <summary className="cursor-pointer font-semibold">
                {field.label}{" "}
                <span className="text-xs text-ink-muted">· {fieldTypeLabel(field.type)}{field.isAdvanced ? " · Optional extra" : ""}</span>
                {field.shortHelp ? <span className="mt-1 block text-sm font-normal text-ink-muted">{field.shortHelp}</span> : null}
                {!field.isActive ? " — inactive" : ""}
              </summary>
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <label className="text-sm font-semibold">
                    Short ID
                    <Input
                      value={field.key}
                      onChange={(event) =>
                        updateField(index, {
                          ...field,
                          key: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="text-sm font-semibold">
                    Label
                    <Input
                      value={field.label}
                      onChange={(event) =>
                        updateField(index, {
                          ...field,
                          label: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="text-sm font-semibold">
                    Answer format
                    <Select
                      value={field.type}
                      onChange={(event) =>
                        updateField(index, {
                          ...field,
                          type: event.target.value as AdminField["type"],
                        })
                      }
                    >
                      {(["SELECT",
                        "RADIO",
                        "NUMBER",
                        "BOOLEAN",
                        "MULTISELECT"] as const).map((type) => (
                        <option value={type} key={type}>
                          {fieldTypeLabel(type)}
                        </option>
                      ))}
                    </Select>
                    <AnswerFormatHelp type={field.type} />
                    <PriceChangeHelp type={field.effectType} />
                  </label>
                  <label className="flex items-center gap-2 pt-6 text-sm font-semibold">
                    <Checkbox
                      checked={field.required}
                      onChange={(event) =>
                        updateField(index, {
                          ...field,
                          required: event.target.checked,
                        })
                      }
                    />{" "}
                    Required
                  </label>
                </div>
                <label className="block text-sm font-semibold">
                  Help text
                  <Textarea
                    rows={2}
                    value={field.helpText ?? ""}
                    onChange={(event) =>
                      updateField(index, {
                        ...field,
                        helpText: event.target.value || null,
                      })
                    }
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-semibold">Short help shown to visitors<Input className="mt-1" value={field.shortHelp ?? ""} onChange={(event) => updateField(index, { ...field, shortHelp: event.target.value || null })} /></label>
                  <label className="text-sm font-semibold">Unit shown beside the answer<Input className="mt-1" value={field.unitLabel ?? ""} onChange={(event) => updateField(index, { ...field, unitLabel: event.target.value || null })} /></label>
                  {field.type === "NUMBER" ? <label className="text-sm font-semibold">Suggested number choices<Input className="mt-1" value={field.presetValues.join(", ")} placeholder="600, 800, 1200" onChange={(event) => updateField(index, { ...field, presetValues: event.target.value.split(",").map((item) => Number(item.trim())).filter((item) => Number.isInteger(item) && item > 0) })} /><span className="mt-1 block text-xs font-normal text-ink-muted">Separate values with commas, for example 600, 800, 1200.</span></label> : null}
                  <label className="flex items-center gap-2 text-sm font-semibold"><Checkbox checked={field.isAdvanced} onChange={(event) => updateField(index, { ...field, isAdvanced: event.target.checked, required: event.target.checked ? false : field.required })} />Show under Optional extras</label>
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  <label className="text-sm font-semibold">
                    Min
                    <Input
                      type="number"
                      value={field.min ?? ""}
                      onChange={(event) =>
                        updateField(index, {
                          ...field,
                          min:
                            event.target.value === ""
                              ? null
                              : Number(event.target.value),
                        })
                      }
                    />
                  </label>
                  <label className="text-sm font-semibold">
                    Max
                    <Input
                      type="number"
                      value={field.max ?? ""}
                      onChange={(event) =>
                        updateField(index, {
                          ...field,
                          max:
                            event.target.value === ""
                              ? null
                              : Number(event.target.value),
                        })
                      }
                    />
                  </label>
                  <label className="text-sm font-semibold">
                    Step
                    <Input
                      type="number"
                      value={field.step ?? ""}
                      onChange={(event) =>
                        updateField(index, {
                          ...field,
                          step:
                            event.target.value === ""
                              ? null
                              : Number(event.target.value),
                        })
                      }
                    />
                  </label>
                  <label className="text-sm font-semibold">
                    Price change
                    <Select
                      value={field.effectType}
                      onChange={(event) =>
                        updateField(index, {
                          ...field,
                          effectType: event.target
                            .value as AdminField["effectType"],
                        })
                      }
                    >
                      {effectTypes.map((effect) => (
                        <option value={effect} key={effect}>
                          {effectLabel(effect)}
                        </option>
                      ))}
                    </Select>
                  </label>
                </div>
                <div>
                  <h3 className="text-sm font-semibold">
                    {estimatorVocabulary.terms.showIf.label}…
                  </h3>
                  <div className="mt-2">
                    {field.advancedShowIf ? (
                      <p className="rounded-control border bg-surface-alt p-3 text-sm">Advanced condition — {conditionToReadable(field.advancedShowIf, (key) => fields.find((item) => item.key === key)?.label ?? "an earlier answer")}. This condition stays as it is.</p>
                    ) : field.showIf ? (
                      <ClauseEditor
                        clause={field.showIf}
                        fields={fields}
                        onChange={(showIf) =>
                          updateField(index, { ...field, showIf })
                        }
                        onRemove={() =>
                          updateField(index, { ...field, showIf: null })
                        }
                      />
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          updateField(index, { ...field, showIf: newClause() })
                        }
                      >
                        Add visibility condition
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      Choices and price changes
                    </h3>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        updateField(index, {
                          ...field,
                          options: [
                            ...field.options,
                            newOption(field.options.length),
                          ],
                        })
                      }
                    >
                      Add option
                    </Button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {field.options.map((option, optionIndex) => (
                      <OptionEditor
                        key={`${option.value}-${optionIndex}`}
                        option={option}
                        onChange={(next) =>
                          updateField(index, {
                            ...field,
                            options: field.options.map((item, itemIndex) =>
                              itemIndex === optionIndex ? next : item,
                            ),
                          })
                        }
                        onRemove={() =>
                          updateField(index, {
                            ...field,
                            options: field.options.filter(
                              (_, itemIndex) => itemIndex !== optionIndex,
                            ),
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={index === 0}
                    onClick={() => moveField(index, -1)}
                  >
                    Move up
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={index === fields.length - 1}
                    onClick={() => moveField(index, 1)}
                  >
                    Move down
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      updateField(index, {
                        ...field,
                        isActive: !field.isActive,
                      })
                    }
                  >
                    {field.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            </details>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-heading text-xl font-semibold">4. Special conditions</h2>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl font-semibold">
              Special conditions
            </h2>
            <p className="text-sm text-ink-muted">
              Conditions are dropdown-driven and stored as a safe declarative
              rule.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              set("rules", [...service.rules, newRule(service.rules.length)])
            }
          >
            Add rule
          </Button>
        </div>
        <div className="mt-5 space-y-4">
          {service.rules.map((rule, index) => (
            <div
              className="rounded-card border p-4"
              key={`${rule.id ?? "new"}-${index}`}
            >
              <div className="grid gap-3 md:grid-cols-[1fr_8rem_auto]">
                <Input
                  aria-label="Rule name"
                  value={rule.name}
                  onChange={(event) =>
                    updateRule(index, { ...rule, name: event.target.value })
                  }
                />
                <Input
                  aria-label="Rule order"
                  type="number"
                  value={rule.order}
                  onChange={(event) =>
                    updateRule(index, {
                      ...rule,
                      order: Number(event.target.value),
                    })
                  }
                />
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={rule.isActive}
                    onChange={(event) =>
                      updateRule(index, {
                        ...rule,
                        isActive: event.target.checked,
                      })
                    }
                  />{" "}
                  Enabled
                </label>
              </div>
              {rule.advancedCondition ? <p className="mt-3 rounded-control border bg-surface-alt p-3 text-sm"><span className="font-semibold">Advanced condition:</span> If {conditionToReadable(rule.advancedCondition, (key) => fields.find((item) => item.key === key)?.label ?? "an earlier answer")}. This condition stays as it is.</p> : <>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Every part of this condition must match
              </p>
              <div className="mt-2 space-y-2">
                {rule.condition.all.map((clause, clauseIndex) => (
                  <ClauseEditor
                    key={clauseIndex}
                    clause={clause}
                    fields={fields}
                    onChange={(next) =>
                      updateRule(index, {
                        ...rule,
                        condition: {
                          all: rule.condition.all.map((item, itemIndex) =>
                            itemIndex === clauseIndex ? next : item,
                          ),
                        },
                      })
                    }
                    onRemove={
                      rule.condition.all.length > 1
                        ? () =>
                            updateRule(index, {
                              ...rule,
                              condition: {
                                all: rule.condition.all.filter(
                                  (_, itemIndex) => itemIndex !== clauseIndex,
                                ),
                              },
                            })
                        : undefined
                    }
                  />
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="mt-2"
                onClick={() =>
                  updateRule(index, {
                    ...rule,
                    condition: { all: [...rule.condition.all, newClause()] },
                  })
                }
              >
                Add condition
              </Button>
              </>}
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-sm font-semibold">
                  Price change
                  <Select
                    value={rule.effectType}
                    onChange={(event) =>
                      updateRule(index, {
                        ...rule,
                        effectType: event.target
                          .value as AdminRule["effectType"],
                      })
                    }
                  >
                    {effectTypes.map((effect) => (
                      <option value={effect} key={effect}>
                        {effectLabel(effect)}
                      </option>
                    ))}
                  </Select>
                  <PriceChangeHelp type={rule.effectType} />
                </label>
                <label className="text-sm font-semibold">
                    Price change amount
                  <Input
                    type="number"
                    value={rule.effectValue}
                    onChange={(event) =>
                      updateRule(index, {
                        ...rule,
                        effectValue: Number(event.target.value),
                      })
                    }
                  />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={index === 0}
                  onClick={() => moveRule(index, -1)}
                >
                  Move up
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={index === service.rules.length - 1}
                  onClick={() => moveRule(index, 1)}
                >
                  Move down
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    set(
                      "rules",
                      service.rules.filter(
                        (_, ruleIndex) => ruleIndex !== index,
                      ),
                    )
                  }
                >
                  Remove rule
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="font-heading text-xl font-semibold">Question price changes</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Optional price changes applied when a question has a value. Choice price changes are
          configured above.
        </p>
        <div className="mt-4 space-y-3">
          {fields.map((field, index) => (
            <div
              className="grid gap-3 rounded-control border p-3 sm:grid-cols-[1fr_12rem_10rem]"
              key={`${field.key}-effect`}
            >
              <span className="self-center text-sm font-semibold">
                {field.label}
              </span>
              <Select
                aria-label={`${field.label} price change`}
                value={field.effectType}
                onChange={(event) =>
                  updateField(index, {
                    ...field,
                    effectType: event.target.value as AdminField["effectType"],
                  })
                }
              >
                {effectTypes.map((effect) => (
                  <option value={effect} key={effect}>
                    {effectLabel(effect)}
                  </option>
                ))}
              </Select>
              <PriceChangeHelp type={field.effectType} />
              <Input
                aria-label={`${field.label} price change amount`}
                type="number"
                value={field.effectValue ?? ""}
                onChange={(event) =>
                  updateField(index, {
                    ...field,
                    effectValue:
                      event.target.value === ""
                        ? null
                        : Number(event.target.value),
                  })
                }
              />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="font-heading text-xl font-semibold">6. What&apos;s included, not included, and the disclaimer</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">What&apos;s included (one item per line)<Textarea rows={4} value={service.includedText.join("\n")} onChange={(event) => set("includedText", event.target.value.split("\n"))} /></label>
          <label className="text-sm font-semibold">What&apos;s not included (one item per line)<Textarea rows={4} value={service.notIncludedText.join("\n")} onChange={(event) => set("notIncludedText", event.target.value.split("\n"))} /></label>
        </div>
        <label className="mt-4 block text-sm font-semibold">Estimate disclaimer<Textarea className="mt-1" rows={2} value={service.disclaimer ?? ""} onChange={(event) => set("disclaimer", event.target.value || null)} /></label>
      </Card>

      <div className="flex justify-end rounded-card border bg-surface p-3 shadow-soft">
        {saveControl}
      </div>
    </div>
  );
}

export function EstimatorEditor({ data, initialServiceId }: { data: EstimatorAdminData; initialServiceId?: string }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(initialServiceId ?? data.services[0]?.id ?? "");
  const [templateId, setTemplateId] = useState<EstimatorTemplateId>("area-packages");
  const [newName, setNewName] = useState("New construction estimate");
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [zones, setZones] = useState(data.zones);
  const [zoneMessage, setZoneMessage] = useState<string | null>(null);
  const [zoneSaving, setZoneSaving] = useState(false);
  const selected =
    data.services.find((service) => service.id === selectedId) ??
    data.services[0];
  async function createFromTemplate() {
    const response = await createEstimatorFromTemplate({ templateId, name: newName });
    if (!response.ok) { setCreateMessage(response.error.message); return; }
    router.push(`/admin/estimator/${response.data.slug}`);
  }
  async function duplicateSelected() {
    if (!selected) return;
    const response = await duplicateEstimatorService({ id: selected.id });
    if (!response.ok) { setCreateMessage(response.error.message); return; }
    router.push(`/admin/estimator/${response.data.slug}`);
  }
  async function saveZones() {
    setZoneSaving(true);
    const result = await saveLocationZones({ zones });
    setZoneSaving(false);
    setZoneMessage(result.ok ? "Location surcharges saved." : result.error.message);
  }
  return (
    <div className="grid gap-6 xl:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="h-fit rounded-card border bg-surface p-3 xl:sticky xl:top-4">
        <h2 className="px-3 py-2 font-heading text-lg font-semibold">
          Estimator services
        </h2>
        <div className="mt-2 space-y-1">
          {data.services.map((service) => (
            <button
              type="button"
              key={service.id}
              onClick={() => setSelectedId(service.id)}
              className={`w-full rounded-control px-3 py-3 text-left text-sm ${selected?.id === service.id ? "bg-brand/15 font-semibold" : "hover:bg-surface-alt"}`}
            >
              <span className="block">{service.name}</span>
              <span className="text-xs text-ink-muted">
                {service.isActive ? "Active" : "Inactive"} ·{" "}
                {pricingModeLabel(service.pricingMode)}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-4 border-t pt-4">
          <h3 className="text-sm font-semibold">Create from a starting point</h3>
          <Select className="mt-2 w-full" value={templateId} onChange={(event) => setTemplateId(event.target.value as EstimatorTemplateId)} aria-label="Choose a service starting point">
            {estimatorTemplates.map((template) => <option key={template.id} value={template.id}>{template.title}</option>)}
          </Select>
          <Input className="mt-2" aria-label="New service name" value={newName} onChange={(event) => setNewName(event.target.value)} />
          <Button type="button" className="mt-2 w-full" onClick={() => void createFromTemplate()} disabled={newName.trim().length < 2}>Create from template</Button>
          {createMessage ? <p role="status" className="mt-2 text-sm">{createMessage}</p> : null}
        </div>
      </aside>
      <main className="space-y-6">
        {selected ? (
          <>
            <div className="flex justify-end"><Button type="button" variant="secondary" onClick={() => void duplicateSelected()}>Duplicate this service</Button></div>
            <ServiceEditor key={selected.id} initial={selected} zones={zones} initialZones={data.zones} />
          </>
        ) : (
          <Card><h2 className="font-heading text-xl font-semibold">Start with a ready-made service</h2><p className="mt-2 text-sm text-ink-muted">Choose a starting point, then add your approved prices before showing it to visitors.</p></Card>
        )}
        <Card>
          <div className="flex items-center justify-between">
            <div>
                  <h2 className="font-heading text-xl font-semibold">
                5. Location surcharges
              </h2>
              <p className="text-sm text-ink-muted">
                A percentage is added after other price changes.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() =>
                setZones((current) => [
                  ...current,
                  {
                    id: undefined,
                    name: "New location",
                    keywords: [""],
                    multiplierPct: 0,
                    sortOrder: current.length,
                    isActive: true,
                  },
                ])
              }
            >
              Add location surcharge
            </Button>
          </div>
          {zoneMessage ? (
            <p role="status" className="mt-3 text-sm">
              {zoneMessage}
            </p>
          ) : null}
          <div className="mt-4 space-y-3">
            {zones.map((zone, index) => (
              <div
                className="grid gap-2 rounded-control border p-3 md:grid-cols-[1fr_1.5fr_8rem_auto]"
                key={zone.id ?? `new-${index}`}
              >
                <Input
                  aria-label="Location name"
                  value={zone.name}
                  onChange={(event) =>
                    setZones((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, name: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
                <Input
                  aria-label="Extra location names"
                  value={zone.keywords.join(", ")}
                  onChange={(event) =>
                    setZones((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? {
                              ...item,
                              keywords: event.target.value
                                .split(",")
                                .map((keyword) => keyword.trim())
                                .filter(Boolean),
                            }
                          : item,
                      ),
                    )
                  }
                />
                <Input
                  aria-label="Price change percentage"
                  type="number"
                  value={zone.multiplierPct}
                  onChange={(event) =>
                    setZones((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? {
                              ...item,
                              multiplierPct: Number(event.target.value),
                            }
                          : item,
                      ),
                    )
                  }
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setZones((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, isActive: !item.isActive }
                          : item,
                      ),
                    )
                  }
                >
                  {zone.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-control border bg-surface-alt p-3 text-sm">Default / other areas: 0% (always applies when no named area matches).</p>
          <div className="mt-4 flex justify-end">
            <Button type="button" loading={zoneSaving} onClick={saveZones}>
              Save location surcharges
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
