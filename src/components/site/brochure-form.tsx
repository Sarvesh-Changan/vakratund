"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import Link from "next/link";
import { requestBrochure } from "@/app/(site)/lead-actions";
import { getLeadTracking } from "./attribution";
import { brochureSubmissionSchema, type BrochureSubmission } from "@/lib/validation/leads";
import { Button, Checkbox, FormField, Input, fieldDescribedBy } from "@/components/ui";

type BrochureFields = BrochureSubmission["contact"];

export function BrochureForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<BrochureFields>({
    resolver: zodResolver(brochureSubmissionSchema.shape.contact),
    defaultValues: { name: "", phone: "+91", email: "", website: "", consent: false },
    mode: "onBlur",
  });

  const onSubmit: SubmitHandler<BrochureFields> = async (contact) => {
    setSubmitError(null);
    const response = await requestBrochure({
      contact,
      formStartedAt: startedAt,
      tracking: getLeadTracking(typeof window === "undefined" ? "/download/company-profile" : window.location.pathname),
    });
    if (response && !response.ok) setSubmitError(response.message);
  };

  return <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
    <FormField label="Name" htmlFor="brochure-name" required error={errors.name?.message}><Input id="brochure-name" autoComplete="name" {...register("name")} aria-describedby={fieldDescribedBy("brochure-name", undefined, errors.name?.message)} /></FormField>
    <FormField label="Phone" htmlFor="brochure-phone" required hint="Use +91 followed by 10 digits." error={errors.phone?.message}><Input id="brochure-phone" type="tel" inputMode="tel" autoComplete="tel" {...register("phone")} aria-describedby={fieldDescribedBy("brochure-phone", "Use +91 followed by 10 digits.", errors.phone?.message)} /></FormField>
    <FormField label="Email" htmlFor="brochure-email" required error={errors.email?.message}><Input id="brochure-email" type="email" autoComplete="email" {...register("email")} aria-describedby={fieldDescribedBy("brochure-email", undefined, errors.email?.message)} /></FormField>
    <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true"><label htmlFor="brochure-website">Website</label><Input id="brochure-website" tabIndex={-1} autoComplete="off" {...register("website")} /></div>
    <FormField label="Consent" htmlFor="brochure-consent" required error={errors.consent?.message}><div className="flex items-start gap-3"><Checkbox id="brochure-consent" {...register("consent")} aria-describedby={fieldDescribedBy("brochure-consent", undefined, errors.consent?.message)} /><label htmlFor="brochure-consent" className="text-sm leading-6 text-ink-muted">I agree to the <Link href="/privacy" className="font-semibold text-brand-deep underline-offset-4 hover:underline">Privacy Policy</Link> and consent to Vakratund Construction using these details to provide the brochure.</label></div></FormField>
    {submitError ? <p role="alert" className="rounded-control border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{submitError}</p> : null}
    <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">Request brochure</Button>
  </form>;
}
