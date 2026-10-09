"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import Link from "next/link";

import { submitContact, submitProjectEnquiry } from "@/app/(site)/lead-actions";
import { contactSchema, type ContactInput } from "@/lib/validation/contact";
import { getLeadTracking } from "./attribution";
import { Button, Checkbox, FormField, Input, Textarea, fieldDescribedBy } from "@/components/ui";

type ContactFormProps = { projectPrefill?: string; projectSlug?: string };

export function ContactForm({ projectPrefill = "", projectSlug = "" }: ContactFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());
  const defaultMessage = projectPrefill ? `I would like to discuss a project similar to: ${projectPrefill}` : "";
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", phone: "+91", email: "", location: "", message: defaultMessage, website: "", consent: false },
    mode: "onBlur",
  });

  const onSubmit: SubmitHandler<ContactInput> = async (value) => {
    setSubmitError(null);
    const payload = {
      contact: value,
      formStartedAt: startedAt,
      tracking: getLeadTracking(typeof window === "undefined" ? "/contact" : window.location.pathname),
    };
    const response = projectSlug
      ? await submitProjectEnquiry({ ...payload, projectSlug })
      : await submitContact(payload);
    if (response && !response.ok) {
      setSubmitError(response.message);
      return;
    }
    setSubmitted(true);
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Name" htmlFor="contact-name" required error={errors.name?.message}>
          <Input id="contact-name" autoComplete="name" {...register("name")} aria-describedby={fieldDescribedBy("contact-name", undefined, errors.name?.message)} />
        </FormField>
        <FormField label="Phone" htmlFor="contact-phone" required hint="Use +91 followed by 10 digits." error={errors.phone?.message}>
          <Input id="contact-phone" type="tel" inputMode="tel" autoComplete="tel" {...register("phone")} aria-describedby={fieldDescribedBy("contact-phone", "Use +91 followed by 10 digits.", errors.phone?.message)} />
        </FormField>
      </div>
      <FormField label="Email" htmlFor="contact-email" hint="Optional" error={errors.email?.message}>
        <Input id="contact-email" type="email" autoComplete="email" {...register("email")} aria-describedby={fieldDescribedBy("contact-email", "Optional", errors.email?.message)} />
      </FormField>
      <FormField label="Location" htmlFor="contact-location" required error={errors.location?.message}>
        <Input id="contact-location" autoComplete="address-level2" {...register("location")} aria-describedby={fieldDescribedBy("contact-location", undefined, errors.location?.message)} />
      </FormField>
      <FormField label="How can we help?" htmlFor="contact-message" required error={errors.message?.message}>
        <Textarea id="contact-message" rows={6} {...register("message")} aria-describedby={fieldDescribedBy("contact-message", undefined, errors.message?.message)} />
      </FormField>

      <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <Input id="contact-website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <FormField label="Consent" htmlFor="contact-consent" required error={errors.consent?.message}>
        <div className="flex items-start gap-3">
          <Checkbox id="contact-consent" {...register("consent")} aria-describedby={fieldDescribedBy("contact-consent", undefined, errors.consent?.message)} />
          <label htmlFor="contact-consent" className="text-sm leading-6 text-ink-muted">I agree to the <Link href="/privacy" className="font-semibold text-brand-deep underline-offset-4 hover:underline">Privacy Policy</Link> and consent to Vakratund Construction using these details to respond to my enquiry.</label>
        </div>
      </FormField>

      {submitError ? <p className="rounded-control border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{submitError}</p> : null}
      <Button type="submit" loading={isSubmitting} disabled={submitted} className="w-full sm:w-auto">Send enquiry</Button>
    </form>
  );
}
