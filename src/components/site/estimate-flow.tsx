"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { contactSchema } from "@/lib/validation/contact";
import { calculateEstimate } from "@/server/estimator/calculate";
import { conditionMatches } from "@/server/estimator/conditions";
import { validateAnswers } from "@/server/estimator/validate";
import type {
  AnswerValue,
  Answers,
  EstimatorConfig,
  Field,
  EstimateResult,
} from "@/server/estimator/types";
import {
  Button,
  Card,
  Checkbox,
  FormField,
  Input,
  Radio,
  Select,
  Sheet,
  Stepper,
  Textarea,
  fieldDescribedBy,
} from "@/components/ui";
import { submitQuote } from "@/app/(site)/estimate/actions";
import { getLeadTracking } from "./attribution";

const steps = [
  { label: "Service" },
  { label: "Details" },
  { label: "Result" },
  { label: "Contact" },
] as const;
const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const storageKey = "vakratund-estimator-draft";
const minimumFillTimeMs = 1_200;

type ContactDraft = {
  name: string;
  phone: string;
  email: string;
  location: string;
  requirements: string;
  website: string;
  consent: boolean;
};
type StoredDraft = { slug: string; step: number; answers: Answers };

const emptyContact: ContactDraft = {
  name: "",
  phone: "+91",
  email: "",
  location: "",
  requirements: "",
  website: "",
  consent: false,
};

function isAnswerValue(value: unknown): value is AnswerValue {
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
    const parsed: unknown = JSON.parse(
      window.sessionStorage.getItem(storageKey) ?? "null",
    );
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as {
      slug?: unknown;
      step?: unknown;
      answers?: unknown;
    };
    if (
      typeof record.slug !== "string" ||
      !configs.some((config) => config.slug === record.slug) ||
      typeof record.answers !== "object" ||
      !record.answers
    )
      return null;
    const config = configs.find((item) => item.slug === record.slug);
    if (!config) return null;
    const allowedKeys = new Set(config.fields.map((field) => field.key));
    const answers: Answers = {};
    for (const [key, value] of Object.entries(
      record.answers as Record<string, unknown>,
    ))
      if (allowedKeys.has(key) && isAnswerValue(value)) answers[key] = value;
    const step =
      typeof record.step === "number" && Number.isInteger(record.step)
        ? Math.min(3, Math.max(0, record.step))
        : 0;
    return { slug: record.slug, step, answers };
  } catch {
    return null;
  }
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

function answerText(value: AnswerValue | undefined): string {
  return Array.isArray(value)
    ? value.join(", ")
    : value === undefined
      ? ""
      : String(value);
}

function fieldOptions(field: Field) {
  return field.options.filter((option) => option.isActive !== false);
}

function updateArray(
  value: AnswerValue | undefined,
  item: string,
  checked: boolean,
): string[] {
  const current = Array.isArray(value) ? [...value] : [];
  return checked
    ? [...new Set([...current, item])]
    : current.filter((entry) => entry !== item);
}

function EstimateSummary({
  config,
  result,
}: {
  config: EstimatorConfig;
  result: EstimateResult;
}) {
  return (
    <Card
      aria-live="polite"
      className="border-brand/30 bg-surface shadow-raised"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-deep">
        {config.name}
      </p>
      {result.low !== null && result.high !== null ? (
        <>
          <p className="mt-3 font-heading text-3xl font-bold">
            {currency.format(result.low)} – {currency.format(result.high)}
          </p>
          <p className="mt-2 text-sm text-ink-muted">Indicative range</p>
          {result.breakdown.length > 0 ? (
            <ul className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
              {result.breakdown.map((item) => (
                <li key={item.id} className="flex justify-between gap-4">
                  <span>{item.label}</span>
                  <span className="font-semibold">
                    {item.amount === 0
                      ? "Included"
                      : currency.format(item.amount)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <p className="mt-3 text-sm text-ink-muted">
          Complete the required details to see the result.
        </p>
      )}
      <p className="mt-5 border-t border-line pt-4 text-xs leading-5 text-ink-muted">
        Indicative estimate. Final quotation after site inspection.
      </p>
    </Card>
  );
}

function DynamicField({
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
  const describedBy = fieldDescribedBy(
    field.key,
    field.helpText ?? undefined,
    error,
  );
  const options = fieldOptions(field);
  return (
    <FormField
      label={field.label}
      htmlFor={field.key}
      required={field.required}
      hint={field.helpText ?? undefined}
      error={error}
    >
      {field.type === "SELECT" ? (
        <Select
          id={field.key}
          value={answerText(value)}
          onChange={(event) => onChange(event.target.value || undefined)}
          aria-describedby={describedBy}
        >
          <option value="">Choose an option</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      ) : null}
      {field.type === "RADIO" ? (
        <div
          id={field.key}
          className="grid gap-2 sm:grid-cols-2"
          aria-describedby={describedBy}
        >
          {options.map((option) => (
            <label
              key={option.value}
              className="flex min-h-12 items-center gap-3 rounded-control border px-3 py-2 text-sm hover:bg-surface-alt"
            >
              <Radio
                name={field.key}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      ) : null}
      {field.type === "NUMBER" ? (
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
      ) : null}
      {field.type === "BOOLEAN" ? (
        <label className="flex min-h-12 items-center gap-3 rounded-control border px-3 py-2 text-sm">
          <Checkbox
            id={field.key}
            checked={value === true}
            onChange={(event) => onChange(event.target.checked)}
            aria-describedby={describedBy}
          />{" "}
          Yes
        </label>
      ) : null}
      {field.type === "MULTISELECT" ? (
        <div
          id={field.key}
          className="grid gap-2 sm:grid-cols-2"
          aria-describedby={describedBy}
        >
          {options.map((option) => (
            <label
              key={option.value}
              className="flex min-h-12 items-center gap-3 rounded-control border px-3 py-2 text-sm hover:bg-surface-alt"
            >
              <Checkbox
                checked={Array.isArray(value) && value.includes(option.value)}
                onChange={(event) =>
                  onChange(
                    updateArray(value, option.value, event.target.checked),
                  )
                }
              />
              {option.label}
            </label>
          ))}
        </div>
      ) : null}
    </FormField>
  );
}

export function EstimateFlow({
  configs,
}: {
  configs: readonly EstimatorConfig[];
}) {
  const initialConfig = configs[0];
  const [selectedSlug, setSelectedSlug] = useState(initialConfig?.slug ?? "");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(() =>
    initialConfig
      ? { [initialConfig.areaFieldKey]: initialConfig.minArea }
      : {},
  );
  const [contact, setContact] = useState<ContactDraft>(emptyContact);
  const [contactErrors, setContactErrors] = useState<Record<string, string>>(
    {},
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [inspectionRequirements, setInspectionRequirements] = useState("");
  const [formStartedAt] = useState(() => Date.now());
  const restored = useRef(false);
  const config =
    configs.find((item) => item.slug === selectedSlug) ?? initialConfig;
  const visible = useMemo(
    () =>
      config
        ? config.fields.filter(
            (field) =>
              field.isActive !== false &&
              conditionMatches(field.showIf, answers),
          )
        : [],
    [answers, config],
  );
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
  const areaField = config?.fields.find(
    (field) => field.key === config.areaFieldKey,
  );
  const isInspection = config?.pricingMode === "INSPECTION_ONLY";

  useEffect(() => {
    const draft = readDraft(configs);
    if (draft) {
      const restore = window.setTimeout(() => {
        setSelectedSlug(draft.slug);
        setAnswers(draft.answers);
        setStep(Math.min(2, draft.step));
      }, 0);
      restored.current = true;
      return () => window.clearTimeout(restore);
    }
    restored.current = true;
    return undefined;
  }, [configs]);

  useEffect(() => {
    if (!restored.current || typeof window === "undefined") return;
    const draft: StoredDraft = {
      slug: selectedSlug,
      step: Math.min(2, step),
      answers,
    };
    window.sessionStorage.setItem(storageKey, JSON.stringify(draft));
  }, [answers, selectedSlug, step]);

  function selectService(nextSlug: string) {
    const next = configs.find((item) => item.slug === nextSlug);
    if (!next) return;
    setSelectedSlug(next.slug);
    setAnswers({ [next.areaFieldKey]: next.minArea });
    setStep(1);
    setSubmitted(false);
  }

  function setAnswer(key: string, value: AnswerValue | undefined) {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  function nextStep() {
    if (step === 0 && config) setStep(1);
    else if (step === 1 && config && validateAnswers(config, answers).valid)
      setStep(2);
    else if (step === 2) setStep(3);
  }

  function previousStep() {
    setStep((current) => Math.max(0, current - 1));
    setSubmitted(false);
  }

  function updateContact<K extends keyof ContactDraft>(
    key: K,
    value: ContactDraft[K],
  ) {
    setContact((current) => ({ ...current, [key]: value }));
    setContactErrors((current) => ({ ...current, [key]: "" }));
  }

  async function submitContact() {
    if (!config) {
      setSubmitError("Please choose an estimator service first.");
      return;
    }
    setSubmitError(null);
    const parsed = contactSchema.safeParse({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      location: contact.location,
      message: contact.requirements,
      website: contact.website,
      consent: contact.consent,
    });
    const nextErrors: Record<string, string> = {};
    if (!parsed.success)
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        nextErrors[key] = issue.message;
      }
    if (Date.now() - formStartedAt < minimumFillTimeMs)
      nextErrors.minimumFillTime =
        "Please take a moment to review your details before submitting.";
    setContactErrors(nextErrors);
    if (!parsed.success || Object.keys(nextErrors).length > 0) return;
    setSubmitting(true);
    const response = await submitQuote({
      serviceSlug: config.slug,
      answers,
      contact: { ...contact, minimumFillTimeMs: Date.now() - formStartedAt },
      formStartedAt,
      tracking: getLeadTracking(typeof window === "undefined" ? "/estimate" : window.location.pathname),
      clientPrice: { low: result.low, high: result.high },
    });
    setSubmitting(false);
    if (response && !response.ok) {
      setSubmitError(response.message);
      return;
    }
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
          directly for a project discussion.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-flex min-h-11 items-center rounded-control bg-brand px-5 font-semibold text-brand-ink"
        >
          Contact us
        </Link>
      </Card>
    );

  const summary = <EstimateSummary config={config} result={result} />;
  return (
    <div className="pb-24 md:pb-0">
      {submitError ? (
        <p
          role="alert"
          className="mb-5 rounded-control border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {submitError}
        </p>
      ) : null}
      {submitting ? (
        <p role="status" className="mb-5 text-sm text-ink-muted">
          Submitting your enquiry…
        </p>
      ) : null}
      <Stepper
        currentStep={step}
        steps={steps.map((item) => ({ label: item.label }))}
      />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="min-w-0">
          {step === 0 ? (
            <section aria-labelledby="estimate-service-title">
              <h2
                id="estimate-service-title"
                className="font-heading text-3xl font-bold sm:text-4xl"
              >
                What would you like to estimate?
              </h2>
              <p className="mt-3 max-w-2xl text-ink-muted">
                Choose a service to begin. The next questions are configured for
                that service.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {configs.map((item) => (
                  <button
                    type="button"
                    key={item.slug}
                    onClick={() => selectService(item.slug)}
                    className={`min-h-28 rounded-card border p-5 text-left transition-colors hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-brand-deep focus-visible:outline-offset-2 ${item.slug === config.slug ? "border-brand bg-brand/10" : "bg-surface"}`}
                  >
                    <span className="font-heading text-lg font-semibold">
                      {item.name}
                    </span>
                    <span className="mt-2 block text-sm text-ink-muted">
                      {item.description ??
                        "Configure your project details for an indicative estimate."}
                    </span>
                    <span className="mt-3 block text-xs font-semibold uppercase tracking-wide text-brand-deep">
                      {item.pricingMode === "INSPECTION_ONLY"
                        ? "Site inspection required"
                        : "Indicative estimate"}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
          {step === 1 ? (
            <section aria-labelledby="estimate-details-title">
              <h2
                id="estimate-details-title"
                className="font-heading text-3xl font-bold sm:text-4xl"
              >
                Tell us about the project
              </h2>
              <p className="mt-3 max-w-2xl text-ink-muted">
                These details stay in this browser until you reach the contact
                step.
              </p>
              <div className="mt-8 space-y-6">
                {areaField ? (
                  <FormField
                    label={areaField.label}
                    htmlFor={`${areaField.key}-number`}
                    required
                    hint={areaField.helpText ?? undefined}
                    error={errors[areaField.key]}
                  >
                    <div className="space-y-4">
                      <input
                        aria-label={`${areaField.label} slider`}
                        type="range"
                        min={config.minArea}
                        max={config.maxArea}
                        step={areaField.step ?? 1}
                        value={
                          typeof answers[config.areaFieldKey] === "number"
                            ? (answers[config.areaFieldKey] as number)
                            : config.minArea
                        }
                        onChange={(event) =>
                          setAnswer(
                            config.areaFieldKey,
                            Number(event.target.value),
                          )
                        }
                        className="h-3 w-full cursor-pointer accent-brand"
                      />
                      <div className="flex items-center gap-3">
                        <Input
                          id={`${areaField.key}-number`}
                          type="number"
                          inputMode="numeric"
                          min={config.minArea}
                          max={config.maxArea}
                          step={areaField.step ?? 1}
                          value={
                            typeof answers[config.areaFieldKey] === "number"
                              ? (answers[config.areaFieldKey] as number)
                              : ""
                          }
                          onChange={(event) =>
                            setAnswer(
                              config.areaFieldKey,
                              event.target.value === ""
                                ? undefined
                                : Number(event.target.value),
                            )
                          }
                          aria-describedby={fieldDescribedBy(
                            `${areaField.key}-number`,
                            areaField.helpText ?? undefined,
                            errors[areaField.key],
                          )}
                        />
                        <span className="shrink-0 text-sm text-ink-muted">
                          {config.unit.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </FormField>
                ) : null}
                {visible
                  .filter((field) => field.key !== config.areaFieldKey)
                  .map((field) => (
                    <DynamicField
                      key={field.key}
                      field={field}
                      value={answers[field.key]}
                      error={errors[field.key]}
                      onChange={(value) => setAnswer(field.key, value)}
                    />
                  ))}
              </div>
            </section>
          ) : null}
          {step === 2 ? (
            <section aria-labelledby="estimate-result-title">
              <h2
                id="estimate-result-title"
                className="font-heading text-3xl font-bold sm:text-4xl"
              >
                {isInspection
                  ? "A site inspection is the right next step"
                  : "Your indicative estimate"}
              </h2>
              <div className="mt-6 lg:hidden">{summary}</div>
              {isInspection ? (
                <div className="mt-6 space-y-5">
                  <p className="max-w-2xl text-lg leading-8 text-ink-muted">
                    This service needs a site inspection before a responsible
                    quotation can be prepared.
                  </p>
                  <FormField
                    label="What should we know before the inspection?"
                    htmlFor="inspection-requirements"
                    hint="Optional project context; do not include personal contact details here."
                  >
                    <Textarea
                      id="inspection-requirements"
                      rows={5}
                      value={inspectionRequirements}
                      onChange={(event) =>
                        setInspectionRequirements(event.target.value)
                      }
                    />
                  </FormField>
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => {
                      setContact((current) => ({
                        ...current,
                        requirements: inspectionRequirements,
                      }));
                      setStep(3);
                    }}
                  >
                    Request Site Inspection
                  </Button>
                </div>
              ) : (
                <div className="mt-6" aria-live="polite">
                  {result.low === null ? (
                    <Card>
                      <p className="font-semibold">
                        We need a little more information before showing a
                        price.
                      </p>
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-muted">
                        {result.warnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    </Card>
                  ) : (
                    <Card className="lg:hidden">{summary}</Card>
                  )}
                  <p className="mt-6 text-sm text-ink-muted">
                    Indicative estimate. Final quotation after site inspection.
                  </p>
                </div>
              )}
            </section>
          ) : null}
          {step === 3 ? (
            <section aria-labelledby="estimate-contact-title">
              <h2
                id="estimate-contact-title"
                className="font-heading text-3xl font-bold sm:text-4xl"
              >
                Where should we send the next step?
              </h2>
              <p className="mt-3 max-w-2xl text-ink-muted">
                Share your details and our team can follow up about this
                project.
              </p>
              {submitted ? (
                <Card className="mt-8 border-success/40 bg-success/10">
                  <h2 className="font-heading text-xl font-bold">
                    Thanks — your enquiry is ready.
                  </h2>
                  <p className="mt-2 text-sm text-ink-muted">
                    Your enquiry has been saved. Our team can now follow up
                    about this project.
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
                    required
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
                        undefined,
                        contactErrors.location,
                      )}
                    />
                  </FormField>
                  <FormField
                    label="Requirements"
                    htmlFor="estimate-requirements"
                    required
                    error={contactErrors.message}
                  >
                    <Textarea
                      id="estimate-requirements"
                      rows={6}
                      value={contact.requirements}
                      onChange={(event) =>
                        updateContact("requirements", event.target.value)
                      }
                      aria-describedby={fieldDescribedBy(
                        "estimate-requirements",
                        undefined,
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
                        I agree to the{" "}
                        <Link
                          href="/privacy"
                          className="font-semibold text-brand-deep underline-offset-4 hover:underline"
                        >
                          Privacy Policy
                        </Link>{" "}
                        and consent to Vakratund Construction using these
                        details to respond.
                      </label>
                    </div>
                  </FormField>
                  {contactErrors.minimumFillTime ? (
                    <p role="alert" className="text-sm text-danger">
                      {contactErrors.minimumFillTime}
                    </p>
                  ) : null}
                  <Button type="button" size="lg" onClick={submitContact}>
                    Submit enquiry
                  </Button>
                </div>
              )}
            </section>
          ) : null}
          <div className="mt-10 flex flex-wrap justify-between gap-3 border-t border-line pt-6">
            {step > 0 ? (
              <Button type="button" variant="secondary" onClick={previousStep}>
                Back
              </Button>
            ) : (
              <span />
            )}
            {step < 2 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={step === 1 && Object.keys(errors).length > 0}
              >
                Continue
              </Button>
            ) : step === 2 && !isInspection ? (
              <Button type="button" onClick={nextStep}>
                Continue to contact
              </Button>
            ) : null}
          </div>
        </div>
        <aside className="hidden lg:block lg:sticky lg:top-24">{summary}</aside>
      </div>
      <div className="fixed inset-x-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 md:hidden">
        <Button
          type="button"
          className="w-full shadow-raised"
          onClick={() => setSummaryOpen(true)}
        >
          View estimate summary
        </Button>
      </div>
      <Sheet
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        title="Estimate summary"
      >
        <div className="pb-8">{summary}</div>
      </Sheet>
    </div>
  );
}
