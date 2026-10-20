"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { submitQuote } from "@/app/(site)/estimate/actions";
import {
  Button,
  Card,
  Checkbox,
  FormField,
  Input,
  Radio,
  Select,
  Sheet,
  Textarea,
  fieldDescribedBy,
} from "@/components/ui";
import { trackAnalyticsEvent } from "./analytics-events";
import { getLeadTracking } from "./attribution";
import { ContactLink, TrackedWhatsAppLink } from "./contact-link";
import { phoneHref } from "./contact-utils";
import { ServiceIcon } from "./service-icon";
import { calculateEstimate } from "@/server/estimator/calculate";
import { conditionMatches } from "@/server/estimator/conditions";
import {
  initialAnswers,
  formatINR,
  groupBreakdown,
  selectedLabel,
} from "@/server/estimator/presentation";
import { validateAnswers } from "@/server/estimator/validate";
import type {
  AnswerValue,
  Answers,
  EstimatorConfig,
  Field,
} from "@/server/estimator/types";
import type { ResolvedSiteSettings } from "@/config/site";
import { contactSchema } from "@/lib/validation/contact";

const storageKey = "vakratund-estimator-draft";
const minimumFillTimeMs = 1_200;
const steps = ["Service", "Project", "Your details"] as const;

type ContactDraft = {
  name: string;
  phone: string;
  email: string;
  location: string;
  notes: string;
  website: string;
  consent: boolean;
};
type StoredDraft = { slug: string; step: number; answers: Answers };
const emptyContact: ContactDraft = {
  name: "",
  phone: "+91",
  email: "",
  location: "",
  notes: "",
  website: "",
  consent: false,
};

function isAnswer(value: unknown): value is AnswerValue {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    (Array.isArray(value) && value.every((item) => typeof item === "string"))
  );
}

function readDraft(configs: readonly EstimatorConfig[]): StoredDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw: unknown = JSON.parse(
      window.sessionStorage.getItem(storageKey) ?? "null",
    );
    if (!raw || typeof raw !== "object") return null;
    const record = raw as { slug?: unknown; step?: unknown; answers?: unknown };
    const config =
      typeof record.slug === "string"
        ? configs.find((item) => item.slug === record.slug)
        : undefined;
    if (!config || !record.answers || typeof record.answers !== "object")
      return null;
    const allowed = new Set(config.fields.map((field) => field.key));
    const answers: Answers = {};
    for (const [key, value] of Object.entries(
      record.answers as Record<string, unknown>,
    ))
      if (allowed.has(key) && isAnswer(value)) answers[key] = value;
    return {
      slug: config.slug,
      step:
        typeof record.step === "number"
          ? Math.max(1, Math.min(3, record.step))
          : 1,
      answers,
    };
  } catch {
    return null;
  }
}

function answerText(value: AnswerValue | undefined): string {
  return Array.isArray(value)
    ? value.join(", ")
    : value === undefined
      ? ""
      : String(value);
}

function selectedValues(value: AnswerValue | undefined): string[] {
  return Array.isArray(value)
    ? [...value]
    : typeof value === "string"
      ? [value]
      : [];
}

function fieldErrorMap(
  config: EstimatorConfig,
  answers: Answers,
): Record<string, string> {
  return Object.fromEntries(
    validateAnswers(config, answers).errors.map((error) => [
      error.field,
      error.message,
    ]),
  );
}

function serviceIcon(slug: string): string {
  if (slug.includes("water") || slug.includes("damp")) return "Droplets";
  if (slug.includes("paint")) return "Paintbrush";
  if (slug.includes("repair") || slug.includes("audit")) return "Wrench";
  if (slug.includes("interior")) return "PanelsTopLeft";
  return "Building2";
}

function locationName(config: EstimatorConfig, answers: Answers): string {
  const field = config.fields.find((item) => item.key === "location");
  return field
    ? selectedLabel(field, answers.location)
    : answerText(answers.location);
}

function FieldControl({
  field,
  value,
  error,
  onChange,
}: {
  field: Field;
  value: AnswerValue | undefined;
  error?: string;
  onChange: (value: AnswerValue | undefined) => void;
}) {
  const options = field.options.filter((option) => option.isActive !== false);
  const describedBy = fieldDescribedBy(
    field.key,
    field.shortHelp ?? field.helpText ?? undefined,
    error,
  );
  const values = selectedValues(value);
  return (
    <FormField
      label={field.label}
      htmlFor={field.key}
      required={field.required}
      hint={field.shortHelp ?? undefined}
      error={error}
    >
      {field.type === "NUMBER" ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Input
              id={field.key}
              type="number"
              inputMode="numeric"
              min={field.min ?? undefined}
              max={field.max ?? undefined}
              step={field.step ?? undefined}
              value={typeof value === "number" ? value : ""}
              onChange={(event) =>
                onChange(
                  event.target.value === ""
                    ? undefined
                    : Number(event.target.value),
                )
              }
              aria-describedby={describedBy}
            />
            <span className="shrink-0 text-sm text-ink-muted">
              {field.unitLabel ?? ""}
            </span>
          </div>
          {(field.presetValues?.length ?? 0) > 0 ? (
            <div
              className="flex flex-wrap gap-2"
              aria-label={`${field.label} quick picks`}
            >
              {(field.presetValues ?? []).map((preset) => (
                <button
                  type="button"
                  key={preset}
                  className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${value === preset ? "border-accent bg-accent/15 text-accent-ink" : "border-line bg-bg hover:bg-tint"}`}
                  onClick={() => onChange(preset)}
                >
                  {preset.toLocaleString("en-IN")} {field.unitLabel ?? ""}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      {field.type === "SELECT" ? (
        <Select
          id={field.key}
          value={answerText(value)}
          onChange={(event) => onChange(event.target.value || undefined)}
          aria-describedby={describedBy}
        >
          <option value="">Choose an option</option>
          {options.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      ) : null}
      {field.type === "RADIO" ? (
        <div
          id={field.key}
          tabIndex={-1}
          className="grid gap-3 sm:grid-cols-2"
          role="radiogroup"
          aria-describedby={describedBy}
        >
          {options.map((option) => (
            <label
              key={option.value}
              className={`min-h-16 cursor-pointer rounded-card border p-4 ${value === option.value ? "border-accent bg-accent/10" : "border-line bg-bg hover:bg-tint"}`}
            >
              <span className="flex items-start gap-3">
                <Radio
                  name={field.key}
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => onChange(option.value)}
                />
                <span>
                  <span className="block font-semibold">{option.label}</span>
                  {option.description ? (
                    <span className="mt-1 block text-sm text-ink-muted">
                      {option.description}
                    </span>
                  ) : null}
                </span>
              </span>
            </label>
          ))}
        </div>
      ) : null}
      {field.type === "MULTISELECT" ? (
        <div
          id={field.key}
          tabIndex={-1}
          className="grid gap-3 sm:grid-cols-2"
          aria-describedby={describedBy}
        >
          {options.map((option) => (
            <label
              key={option.value}
              className={`min-h-16 cursor-pointer rounded-card border p-4 ${values.includes(option.value) ? "border-accent bg-accent/10" : "border-line bg-bg hover:bg-tint"}`}
            >
              <span className="flex items-start gap-3">
                <Checkbox
                  checked={values.includes(option.value)}
                  onChange={(event) =>
                    onChange(
                      event.target.checked
                        ? [...new Set([...values, option.value])]
                        : values.filter((item) => item !== option.value),
                    )
                  }
                />
                <span>
                  <span className="block font-semibold">{option.label}</span>
                  {option.description ? (
                    <span className="mt-1 block text-sm text-ink-muted">
                      {option.description}
                    </span>
                  ) : null}
                </span>
              </span>
            </label>
          ))}
        </div>
      ) : null}
      {field.type === "BOOLEAN" ? (
        <label className="flex min-h-12 items-center gap-3 rounded-control border px-3 py-2">
          <Checkbox
            id={field.key}
            checked={value === true}
            onChange={(event) => onChange(event.target.checked)}
            aria-describedby={describedBy}
          />{" "}
          Yes
        </label>
      ) : null}
      {field.helpText && field.helpText !== field.shortHelp ? (
        <p className="mt-2 text-xs text-ink-muted" title={field.helpText}>
          More about this question <span aria-hidden="true">ⓘ</span>
        </p>
      ) : null}
    </FormField>
  );
}

function Summary({
  config,
  answers,
  result,
  onEdit,
}: {
  config: EstimatorConfig;
  answers: Answers;
  result: ReturnType<typeof calculateEstimate>;
  onEdit: (key?: string) => void;
}) {
  const areaValid =
    typeof answers[config.areaFieldKey] === "number" &&
    !validateAnswers(config, {
      [config.areaFieldKey]: answers[config.areaFieldKey],
    }).errors.some((error) => error.field === config.areaFieldKey);
  const showRange = areaValid && result.low !== null && result.high !== null;
  const groups = groupBreakdown(result.breakdown);
  const fields = config.fields.filter(
    (field) =>
      field.isActive !== false && conditionMatches(field.showIf, answers),
  );
  const choices = (advanced: boolean) =>
    fields.filter(
      (field) =>
        (field.isAdvanced === true) === advanced &&
        answers[field.key] !== undefined &&
        answers[field.key] !== "",
    );
  return (
    <Card className="border-accent/30 bg-bg shadow-raised">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-accent-ink">{config.name}</p>
          <h2 className="mt-2 font-heading text-2xl font-bold">
            {config.pricingMode === "INSPECTION_ONLY"
              ? "Site inspection required"
              : showRange
                ? `${formatINR(result.low!)} – ${formatINR(result.high!)}`
                : "Enter your area to see an estimate"}
          </h2>
        </div>
        <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent-ink">
          {config.pricingMode === "INSPECTION_ONLY"
            ? "Inspection"
            : "Indicative estimate"}
        </span>
      </div>
      {config.pricingMode === "INSPECTION_ONLY" ? (
        <p className="mt-3 text-sm text-ink-muted">
          Final quotation will be prepared after a site inspection.
        </p>
      ) : null}
      <div className="mt-6 border-t border-line pt-5">
        <h3 className="font-semibold">Your choices</h3>
        <div className="mt-3 space-y-2">
          {choices(false).map((field) => (
            <ChoiceRow
              key={field.key}
              field={field}
              value={answers[field.key]}
              onEdit={() => onEdit(field.key)}
            />
          ))}
          {choices(true).length > 0 ? (
            <p className="pt-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Extras
            </p>
          ) : null}
          {choices(true).map((field) => (
            <ChoiceRow
              key={field.key}
              field={field}
              value={answers[field.key]}
              onEdit={() => onEdit(field.key)}
            />
          ))}
        </div>
      </div>
      {config.pricingMode === "ESTIMATE" && showRange ? (
        <details className="mt-6 border-t border-line pt-5">
          <summary className="cursor-pointer font-semibold">
            How this is calculated
          </summary>
          <div className="mt-3 space-y-3 text-sm">
            {groups.slice(0, 4).map((group) => (
              <div key={group.id} className="flex justify-between gap-3">
                <span>
                  {group.label}
                  {group.id === "OTHER" &&
                  group.details.some((detail) =>
                    detail.toLowerCase().includes("minimum"),
                  ) ? (
                    <span className="block text-xs text-ink-muted">
                      Minimum job charge applied
                    </span>
                  ) : null}
                </span>
                <span className="font-semibold">
                  {group.amount === 0 ? "Included" : formatINR(group.amount)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-4 border-t border-line pt-4 text-sm sm:grid-cols-2">
            <div>
              <p className="font-semibold">Included</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-muted">
                {(config.includedText ?? []).slice(0, 6).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold">Not included</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-muted">
                {(config.notIncludedText ?? []).slice(0, 6).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </details>
      ) : null}
      <p className="mt-6 border-t border-line pt-4 text-xs leading-5 text-ink-muted">
        Indicative estimate. Final quotation after site inspection.
      </p>
    </Card>
  );
}

function ChoiceRow({
  field,
  value,
  onEdit,
}: {
  field: Field;
  value: AnswerValue | undefined;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-ink-muted">
        {field.label}
        <span className="block font-medium text-ink">
          {selectedLabel(field, value)}
        </span>
      </span>
      <button
        type="button"
        className="min-h-11 shrink-0 px-2 font-semibold text-brand-deep underline"
        onClick={onEdit}
      >
        Edit
      </button>
    </div>
  );
}

function EscapeHatches({
  settings,
  config,
}: {
  settings: ResolvedSiteSettings;
  config: EstimatorConfig;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <ContactLink
        href={phoneHref(settings.phones[0] ?? "")}
        eventType="CALL"
        context="estimate-escape"
        className="font-semibold text-brand-deep underline"
      >
        Call us instead
      </ContactLink>
      <TrackedWhatsAppLink
        settings={settings}
        whatsappContext={{ pageTitle: `${config.name} estimate` }}
        context="estimate-escape"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-brand-deep underline"
      >
        WhatsApp us
      </TrackedWhatsAppLink>
    </div>
  );
}

export function SimplifiedEstimateFlow({
  configs,
  settings,
}: {
  configs: readonly EstimatorConfig[];
  settings: ResolvedSiteSettings;
}) {
  const first = configs[0];
  const [selectedSlug, setSelectedSlug] = useState(first?.slug ?? "");
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>(() =>
    first ? initialAnswers(first) : {},
  );
  const [contact, setContact] = useState<ContactDraft>(emptyContact);
  const [contactErrors, setContactErrors] = useState<Record<string, string>>(
    {},
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [rangeAnnouncement, setRangeAnnouncement] = useState("");
  const [startedAt] = useState(() => Date.now());
  const restored = useRef(false);
  const config = configs.find((item) => item.slug === selectedSlug) ?? first;
  const visible = useMemo(
    () =>
      config?.fields.filter(
        (field) =>
          field.isActive !== false && conditionMatches(field.showIf, answers),
      ) ?? [],
    [answers, config],
  );
  const coreFields = visible.filter((field) => !field.isAdvanced);
  const extraFields = visible.filter((field) => field.isAdvanced === true);
  const result = useMemo(
    () =>
      config
        ? calculateEstimate(config, answers)
        : {
            low: null,
            high: null,
            breakdown: [],
            warnings: ["Choose a service to begin."],
          },
    [answers, config],
  );
  const errors = useMemo(
    () => (config ? fieldErrorMap(config, answers) : {}),
    [answers, config],
  );
  const areaValid = Boolean(
    config &&
    typeof answers[config.areaFieldKey] === "number" &&
    !errors[config.areaFieldKey],
  );
  const selectedExtras = extraFields.filter(
    (field) => answers[field.key] !== undefined && answers[field.key] !== "",
  ).length;

  useEffect(() => {
    const draft = readDraft(configs);
    const timer = window.setTimeout(() => {
      if (draft) {
        setSelectedSlug(draft.slug);
        setAnswers(draft.answers);
        setStep(draft.step);
      }
      restored.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [configs]);
  useEffect(() => {
    if (restored.current && typeof window !== "undefined")
      window.sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          slug: selectedSlug,
          step,
          answers,
        } satisfies StoredDraft),
      );
  }, [answers, selectedSlug, step]);
  useEffect(() => {
    if (config)
      trackAnalyticsEvent("estimate_started", { service_slug: config.slug });
  }, [config]);
  useEffect(() => {
    if (config)
      trackAnalyticsEvent("estimate_step_viewed", {
        service_slug: config.slug,
        step,
      });
  }, [config, step]);
  useEffect(() => {
    if (config && areaValid && result.low !== null)
      trackAnalyticsEvent("estimate_range_viewed", {
        service_slug: config.slug,
      });
  }, [areaValid, config, result.low]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!config) return;
      setRangeAnnouncement(
        config.pricingMode === "INSPECTION_ONLY"
          ? "Site inspection required."
          : areaValid && result.low !== null && result.high !== null
            ? `Indicative estimate ${formatINR(result.low)} to ${formatINR(result.high)}.`
            : "Enter your area to see an estimate.",
      );
    }, 300);
    return () => window.clearTimeout(timer);
  }, [areaValid, config, result.high, result.low]);

  function setAnswer(key: string, value: AnswerValue | undefined) {
    setAnswers((current) => ({ ...current, [key]: value }));
  }
  function selectService(slug: string) {
    const next = configs.find((item) => item.slug === slug);
    if (!next) return;
    setSelectedSlug(slug);
    setAnswers(initialAnswers(next));
    setContact((current) => ({
      ...current,
      location: locationName(next, initialAnswers(next)),
    }));
    setSubmitted(false);
    setStep(2);
  }
  function next() {
    if (!config) return;
    if (step === 1 && config) return;
    if (step === 2) {
      if (Object.keys(errors).length > 0) return;
      setContact((current) => ({
        ...current,
        location: current.location || locationName(config, answers),
      }));
      setStep(3);
    }
  }
  function editField(key?: string) {
    if (!key) return;
    setStep(2);
    const field = config?.fields.find((item) => item.key === key);
    if (field?.isAdvanced) setExtrasOpen(true);
    window.requestAnimationFrame(() => document.getElementById(key)?.focus());
  }
  function previous() {
    setStep((current) => Math.max(1, current - 1));
    setSubmitted(false);
  }
  function updateContact<K extends keyof ContactDraft>(
    key: K,
    value: ContactDraft[K],
  ) {
    setContact((current) => ({ ...current, [key]: value }));
    setContactErrors((current) => ({ ...current, [key]: "" }));
  }
  function openExtras() {
    setExtrasOpen((current) => {
      const nextValue = !current;
      if (nextValue && config)
        trackAnalyticsEvent("estimate_extras_opened", {
          service_slug: config.slug,
        });
      return nextValue;
    });
  }
  async function submitContact() {
    if (!config) return;
    const parsed = contactSchema.safeParse({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      location:
        contact.location || locationName(config, answers) || "To be confirmed",
      message: contact.notes || `Enquiry for ${config.name}.`,
      website: contact.website,
    });
    const nextErrors: Record<string, string> = {};
    if (!parsed.success)
      for (const issue of parsed.error.issues)
        nextErrors[String(issue.path[0] ?? "form")] = issue.message;
    if (Date.now() - startedAt < minimumFillTimeMs)
      nextErrors.minimumFillTime =
        "Please take a moment to review your details before submitting.";
    setContactErrors(nextErrors);
    if (!parsed.success || Object.keys(nextErrors).length > 0) return;
    setSubmitting(true);
    setSubmitError(null);
    const response = await submitQuote({
      serviceSlug: config.slug,
      answers,
      contact: {
        ...contact,
        location:
          contact.location ||
          locationName(config, answers) ||
          "To be confirmed",
        requirements: contact.notes || `Enquiry for ${config.name}.`,
        minimumFillTimeMs: Date.now() - startedAt,
      },
      formStartedAt: startedAt,
      tracking: getLeadTracking(
        typeof window === "undefined" ? "/estimate" : window.location.pathname,
      ),
      clientPrice: { low: result.low, high: result.high },
    });
    setSubmitting(false);
    if (response && !response.ok) {
      setSubmitError(response.message);
      return;
    }
    trackAnalyticsEvent("estimate_submitted", { service_slug: config.slug });
    if (typeof window !== "undefined")
      window.sessionStorage.removeItem(storageKey);
    setSubmitted(true);
  }

  if (!config)
    return (
      <Card>
        <h2 className="font-heading text-2xl font-bold">
          Estimator unavailable
        </h2>
        <p className="mt-3 text-ink-muted">
          Estimator services have not been configured yet. Please contact us
          directly.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-flex min-h-11 items-center rounded-control bg-brand px-5 font-semibold text-brand-ink"
        >
          Contact us
        </Link>
      </Card>
    );
  const summary = (
    <Summary
      config={config}
      answers={answers}
      result={result}
      onEdit={editField}
    />
  );
  return (
    <div className="pb-28 md:pb-0">
      <p className="sr-only" aria-live="polite">
        {rangeAnnouncement}
      </p>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">
          Step {step} of 3{" "}
          <span className="font-normal text-ink-muted">
            — {steps[step - 1]}
          </span>
        </p>
        <EscapeHatches settings={settings} config={config} />
      </div>
      <div
        className="mb-8 h-2 overflow-hidden rounded-full bg-tint"
        aria-label={`Step ${step} of 3`}
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={3}
        aria-valuenow={step}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>
      {submitError ? (
        <p
          role="alert"
          className="mb-5 rounded-control border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {submitError}
        </p>
      ) : null}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start">
        <div className="min-w-0">
          {step === 1 ? (
            <section aria-labelledby="estimate-service-title">
              <h2
                id="estimate-service-title"
                className="font-heading text-3xl font-bold sm:text-4xl"
              >
                What do you need?
              </h2>
              <p className="mt-3 max-w-2xl text-ink-muted">
                Choose one service. We will keep the next questions short.
              </p>
              <div className="mt-8">
                <h3 className="text-lg font-semibold">Get an estimate</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {configs
                    .filter((item) => item.pricingMode === "ESTIMATE")
                    .map((item) => (
                      <ServiceCard
                        key={item.slug}
                        config={item}
                        selected={item.slug === config.slug}
                        onClick={() => selectService(item.slug)}
                      />
                    ))}
                </div>
                <h3 className="mt-8 text-lg font-semibold">
                  Needs a site inspection
                </h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {configs
                    .filter((item) => item.pricingMode === "INSPECTION_ONLY")
                    .map((item) => (
                      <ServiceCard
                        key={item.slug}
                        config={item}
                        selected={item.slug === config.slug}
                        onClick={() => selectService(item.slug)}
                      />
                    ))}
                </div>
              </div>
            </section>
          ) : null}
          {step === 2 ? (
            <section aria-labelledby="estimate-project-title">
              <h2
                id="estimate-project-title"
                className="font-heading text-3xl font-bold sm:text-4xl"
              >
                Your project
              </h2>
              <p className="mt-3 max-w-2xl text-ink-muted">
                A few simple choices are enough to start. Your estimate updates
                as you answer.
              </p>
              <div className="mt-8 space-y-6">
                {coreFields.map((field) => (
                  <div key={field.key} className="estimator-field-transition">
                    <FieldControl
                      field={field}
                      value={answers[field.key]}
                      error={errors[field.key]}
                      onChange={(value) => setAnswer(field.key, value)}
                    />
                  </div>
                ))}
                {extraFields.length > 0 ? (
                  <div className="border-t border-line pt-5">
                    <button
                      type="button"
                      className="flex min-h-11 w-full items-center justify-between text-left font-semibold"
                      aria-expanded={extrasOpen}
                      onClick={openExtras}
                    >
                      <span>
                        Optional extras ({extraFields.length})
                        {selectedExtras > 0 ? (
                          <span className="ml-2 rounded-full bg-accent/15 px-2 py-1 text-xs text-accent-ink">
                            {selectedExtras} selected
                          </span>
                        ) : null}
                      </span>
                      <span aria-hidden="true">{extrasOpen ? "−" : "+"}</span>
                    </button>
                    {extrasOpen ? (
                      <div className="mt-5 space-y-6">
                        {extraFields.map((field) => (
                          <div
                            key={field.key}
                            className="estimator-field-transition"
                          >
                            <FieldControl
                              field={field}
                              value={answers[field.key]}
                              error={errors[field.key]}
                              onChange={(value) => setAnswer(field.key, value)}
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
          {step === 3 ? (
            <section aria-labelledby="estimate-details-title">
              <h2
                id="estimate-details-title"
                className="font-heading text-3xl font-bold sm:text-4xl"
              >
                Your details
              </h2>
              <p className="mt-3 max-w-2xl text-ink-muted">
                Only your name and phone are needed. Notes and email are
                optional.
              </p>
              <div className="mt-5 rounded-card border border-accent/25 bg-accent/10 p-4 text-sm leading-6 text-ink-muted">
                <p className="font-semibold text-ink">
                  {config.name} ·{" "}
                  {config.pricingMode === "INSPECTION_ONLY"
                    ? "Site inspection required"
                    : areaValid && result.low !== null
                      ? `${formatINR(result.low)} – ${formatINR(result.high ?? result.low)}`
                      : "Indicative estimate"}
                </p>
                <p className="mt-1">
                  We use your details only to respond to this enquiry.
                </p>
              </div>
              {submitted ? (
                <Card className="mt-8 border-success/40 bg-success/10">
                  <h2 className="font-heading text-xl font-bold">
                    Thanks — your enquiry is ready.
                  </h2>
                  <p className="mt-2 text-sm text-ink-muted">
                    Your enquiry has been saved. Our team can now follow up.
                  </p>
                  <Link
                    href="/"
                    className="mt-5 inline-flex min-h-11 items-center rounded-control border bg-surface px-4 font-semibold"
                  >
                    Back to home
                  </Link>
                </Card>
              ) : (
                <div className="mt-8 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      label="Name"
                      htmlFor="estimate-name"
                      required
                      error={contactErrors.name}
                    >
                      <Input
                        id="estimate-name"
                        autoComplete="name"
                        value={contact.name}
                        onChange={(event) =>
                          updateContact("name", event.target.value)
                        }
                        aria-describedby={fieldDescribedBy(
                          "estimate-name",
                          undefined,
                          contactErrors.name,
                        )}
                      />
                    </FormField>
                    <FormField
                      label="Phone"
                      htmlFor="estimate-phone"
                      required
                      hint="Use +91 followed by 10 digits."
                      error={contactErrors.phone}
                    >
                      <Input
                        id="estimate-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={contact.phone}
                        onChange={(event) =>
                          updateContact("phone", event.target.value)
                        }
                        aria-describedby={fieldDescribedBy(
                          "estimate-phone",
                          "Use +91 followed by 10 digits.",
                          contactErrors.phone,
                        )}
                      />
                    </FormField>
                  </div>
                  <FormField
                    label="Email"
                    htmlFor="estimate-email"
                    hint="Optional"
                    error={contactErrors.email}
                  >
                    <Input
                      id="estimate-email"
                      type="email"
                      autoComplete="email"
                      value={contact.email}
                      onChange={(event) =>
                        updateContact("email", event.target.value)
                      }
                      aria-describedby={fieldDescribedBy(
                        "estimate-email",
                        "Optional",
                        contactErrors.email,
                      )}
                    />
                  </FormField>
                  <FormField
                    label="Location"
                    htmlFor="estimate-location"
                    hint="Pre-filled from your project choices; editable"
                    error={contactErrors.location}
                  >
                    <Input
                      id="estimate-location"
                      autoComplete="address-level2"
                      value={contact.location}
                      onChange={(event) =>
                        updateContact("location", event.target.value)
                      }
                      aria-describedby={fieldDescribedBy(
                        "estimate-location",
                        "Pre-filled from your project choices; editable",
                        contactErrors.location,
                      )}
                    />
                  </FormField>
                  <FormField
                    label="Notes"
                    htmlFor="estimate-notes"
                    hint="Optional"
                    error={contactErrors.message}
                  >
                    <Textarea
                      id="estimate-notes"
                      rows={4}
                      value={contact.notes}
                      onChange={(event) =>
                        updateContact("notes", event.target.value)
                      }
                      aria-describedby={fieldDescribedBy(
                        "estimate-notes",
                        "Optional",
                        contactErrors.message,
                      )}
                    />
                  </FormField>
                  <div
                    className="absolute -left-[10000px] h-px w-px overflow-hidden"
                    aria-hidden="true"
                  >
                    <label htmlFor="estimate-website">Website</label>
                    <Input
                      id="estimate-website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={contact.website}
                      onChange={(event) =>
                        updateContact("website", event.target.value)
                      }
                    />
                    <input
                      name="minimumFillTime"
                      value={minimumFillTimeMs}
                      readOnly
                      aria-hidden="true"
                    />
                  </div>
                  <FormField
                    label="Consent"
                    htmlFor="estimate-consent"
                    required
                    error={contactErrors.consent}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="estimate-consent"
                        checked={contact.consent}
                        onChange={(event) =>
                          updateContact("consent", event.target.checked)
                        }
                        aria-describedby={fieldDescribedBy(
                          "estimate-consent",
                          undefined,
                          contactErrors.consent,
                        )}
                      />
                      <label
                        htmlFor="estimate-consent"
                        className="text-sm leading-6 text-ink-muted"
                      >
                        I consent to Vakratund Construction using these details
                        to respond.
                      </label>
                    </div>
                  </FormField>
                  {contactErrors.minimumFillTime ? (
                    <p role="alert" className="text-sm text-danger">
                      {contactErrors.minimumFillTime}
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    size="lg"
                    onClick={submitContact}
                    disabled={submitting}
                  >
                    {submitting
                      ? "Submitting…"
                      : config.pricingMode === "INSPECTION_ONLY"
                        ? "Request site inspection"
                        : "Get my estimate"}
                  </Button>
                </div>
              )}
            </section>
          ) : null}
          <div className="mt-10 flex flex-wrap justify-between gap-3 border-t border-line pt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={previous}
              disabled={step === 1}
            >
              Back
            </Button>
            {step === 2 ? (
              <Button
                type="button"
                onClick={next}
                disabled={Object.keys(errors).length > 0}
              >
                Continue to your details
              </Button>
            ) : null}
          </div>
        </div>
        <aside className="hidden lg:sticky lg:top-24 lg:block">{summary}</aside>
      </div>
      <div className="fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 flex items-center gap-2 rounded-card border border-line bg-bg/95 p-2 shadow-raised backdrop-blur md:hidden">
        <button
          type="button"
          className="min-h-11 flex-1 truncate px-3 text-left text-sm font-semibold"
          onClick={() => setSummaryOpen(true)}
        >
          {config.pricingMode === "INSPECTION_ONLY"
            ? "Site inspection required"
            : areaValid && result.low !== null
              ? `${formatINR(result.low)} – ${formatINR(result.high ?? result.low)}`
              : "Estimate pending"}
          <span className="ml-2 font-normal text-ink-muted">View summary</span>
        </button>
        {step === 2 ? (
          <Button
            type="button"
            onClick={next}
            disabled={Object.keys(errors).length > 0}
          >
            Next
          </Button>
        ) : step === 3 ? (
          <Button type="button" onClick={submitContact} disabled={submitting}>
            {config.pricingMode === "INSPECTION_ONLY" ? "Request" : "Submit"}
          </Button>
        ) : null}
      </div>
      <Sheet
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        title="Estimate summary"
        className="m-auto min-h-0 w-full max-w-none rounded-t-panel rounded-b-none sm:max-w-lg"
      >
        <div className="pb-8">{summary}</div>
      </Sheet>
    </div>
  );
}

function ServiceCard({
  config,
  selected,
  onClick,
}: {
  config: EstimatorConfig;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group min-h-32 rounded-card border p-5 text-left shadow-soft transition-[background-color,border-color,box-shadow,transform] hover:-translate-y-1 hover:bg-tint hover:shadow-raised focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 motion-reduce:transition-none ${selected ? "border-accent bg-accent/10 shadow-raised" : "border-line bg-bg"}`}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent-ink">
        <ServiceIcon iconKey={serviceIcon(config.slug)} size={24} />
      </span>
      <span className="mt-4 block font-heading text-lg font-semibold">
        {config.name}
      </span>
      <span className="mt-2 block text-sm text-ink-muted">
        {config.description ??
          "Configure a few project details to get started."}
      </span>
      <span className="mt-3 block text-xs font-semibold uppercase tracking-wide text-brand-deep">
        {config.pricingMode === "INSPECTION_ONLY"
          ? "Site inspection required"
          : "Indicative estimate"}
      </span>
    </button>
  );
}
