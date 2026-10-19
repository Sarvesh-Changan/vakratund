import { z } from "zod";

const trackingText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (value) => !/[\u0000-\u001f\u007f<>]/.test(value),
      "Invalid tracking value.",
    );

export const trackingSchema = z
  .object({
    sourcePage: trackingText(200).optional(),
    referrer: trackingText(500).optional(),
    utmSource: trackingText(120).optional(),
    utmMedium: trackingText(120).optional(),
    utmCampaign: trackingText(160).optional(),
    utmTerm: trackingText(160).optional(),
    utmContent: trackingText(160).optional(),
    deviceType: z.enum(["mobile", "tablet", "desktop", "unknown"]).optional(),
  })
  .strict();

const securityFields = {
  formStartedAt: z.number().finite(),
  turnstileToken: z.string().trim().max(2_048).optional(),
  tracking: trackingSchema.optional(),
};

export const contactLeadSubmissionSchema = z
  .object({
    contact: z
      .object({
        name: z
          .string()
          .trim()
          .min(1)
          .max(100)
          .refine((value) => !/[<>]/.test(value), "HTML is not allowed."),
        phone: z.string().trim().min(1).max(30),
        email: z.string().trim().email().max(254).optional().or(z.literal("")),
        location: z
          .string()
          .trim()
          .min(1)
          .max(160)
          .refine((value) => !/[<>]/.test(value), "HTML is not allowed."),
        message: z
          .string()
          .trim()
          .min(1)
          .max(2_000)
          .refine((value) => !/[<>]/.test(value), "HTML is not allowed."),
        website: z.string().max(200),
        consent: z.boolean().refine((value) => value, "Consent is required."),
      })
      .strict(),
    ...securityFields,
  })
  .strict();

export const projectEnquirySubmissionSchema = z
  .object({
    projectSlug: z
      .string()
      .trim()
      .min(1)
      .max(160)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    contact: contactLeadSubmissionSchema.shape.contact,
    ...securityFields,
  })
  .strict();

export type TrackingInput = z.infer<typeof trackingSchema>;
export type ContactLeadSubmission = z.infer<typeof contactLeadSubmissionSchema>;
export type ProjectEnquirySubmission = z.infer<
  typeof projectEnquirySubmissionSchema
>;
