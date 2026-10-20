"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import Link from "next/link";

import { submitContact, submitProjectEnquiry } from "@/app/(site)/lead-actions";
import { contactSchema, type ContactInput } from "@/lib/validation/contact";
import { getLeadTracking } from "./attribution";
import { Button, FormField, Input, Textarea, fieldDescribedBy } from "@/components/ui";

type ContactFormProps = { projectPrefill?: string; projectSlug?: string };

export function ContactForm({ projectPrefill = "", projectSlug = "" }: ContactFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());
  const defaultMessage = projectPrefill ? `I would like to discuss a project similar to: ${projectPrefill}` : "";
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", phone: "+91", email: "", location: "", message: defaultMessage, website: "" },
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

  if (submitted) return <div className="rounded-card border border-accent/40 bg-accent/10 p-6" role="status"><p className="eyebrow">Enquiry received</p><h3 className="mt-2 font-heading text-2xl font-semibold text-ink">Thank you for reaching out.</h3><p className="mt-3 leading-7 text-ink-muted">Your details have been saved. Our team will review your requirement and follow up with the next useful step.</p><Link href="/projects" className="mt-5 inline-flex min-h-11 items-center rounded-pill bg-dark px-5 font-semibold text-white">Explore projects <span className="ml-2" aria-hidden="true">{"\u2197"}</span></Link></div>;

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
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
        <Textarea id="contact-message" rows={4} className="rounded-md" {...register("message")} aria-describedby={fieldDescribedBy("contact-message", undefined, errors.message?.message)} />
      </FormField>

      <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <Input id="contact-website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      {submitError ? <p className="rounded-control border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{submitError}</p> : null}
      <Button type="submit" loading={isSubmitting} disabled={submitted} className="w-full">Send enquiry</Button>
    </form>
  );
}
