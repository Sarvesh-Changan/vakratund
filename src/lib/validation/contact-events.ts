import { z } from "zod";

export const contactEventSchema = z.object({
  type: z.enum(["CALL", "WHATSAPP"]),
  pagePath: z.string().trim().min(1).max(500).refine((value) => value.startsWith("/") && !value.startsWith("//"), "Page path must be local."),
  context: z.string().trim().max(80).regex(/^[a-z0-9:_-]*$/i, "Invalid event context.").optional(),
}).strict();

export type ContactEventInput = z.infer<typeof contactEventSchema>;
