import { z } from "zod";

const MIN_SECRET_LENGTH = 32;
const BUILD_PHASE = "phase-production-build";
const SECRET_NAMES = ["BETTER_AUTH_SECRET", "IP_HASH_SECRET"] as const;

const placeholderPattern = /(?:build[-_ ]?placeholder|change(?:[-_ ]?me)?|changeme|dev[-_ ]?secret|development[-_ ]?secret|example|dummy|placeholder|your[-_ ]?(?:secret|value)|test[-_ ]?secret|<[^>]+>)/i;

const baseEnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PHASE: z.string().optional(),
  SKIP_ENV_VALIDATION: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),

  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),

  BETTER_AUTH_SECRET: z.string().optional(),
  BETTER_AUTH_URL: z.string().optional(),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),

  SMTP_HOST: z.string().trim().optional(),
  SMTP_PORT: z.preprocess((value) => value === "" || value === undefined ? undefined : Number(value), z.number().int().min(1).max(65_535).optional()),
  SMTP_SECURE: z.preprocess((value) => value === "" || value === undefined ? undefined : value === true || value === "true" || value === "1", z.boolean().optional()),
  SMTP_USER: z.string().trim().email().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().trim().optional(),
  LEAD_NOTIFY_TO: z.string().trim().optional(),

  TURNSTILE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  IP_HASH_SECRET: z.string().optional(),
});

export type Environment = z.infer<typeof baseEnvironmentSchema>;
export type EnvironmentInput = Record<string, string | undefined>;

function isBuildSkip(input: EnvironmentInput): boolean {
  return input.SKIP_ENV_VALIDATION === "1" && input.NEXT_PHASE === BUILD_PHASE;
}

function addSecretIssue(context: z.RefinementCtx, name: (typeof SECRET_NAMES)[number], value: string | undefined, required: boolean): void {
  const trimmed = value?.trim();
  if (!trimmed) {
    if (required) context.addIssue({ code: z.ZodIssueCode.custom, message: `${name} is required.`, path: [name] });
    return;
  }
  if (trimmed.length < MIN_SECRET_LENGTH) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: `${name} must be at least ${MIN_SECRET_LENGTH} characters.`, path: [name] });
  }
  if (placeholderPattern.test(trimmed)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: `${name} must not use a placeholder value.`, path: [name] });
  }
}

export const environmentSchema = baseEnvironmentSchema.superRefine((data, context) => {
  const input = data as unknown as EnvironmentInput;
  if (isBuildSkip(input)) return;
  if (data.SKIP_ENV_VALIDATION === "1" && data.NODE_ENV === "production") {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "SKIP_ENV_VALIDATION is only permitted during an explicit production build, never at runtime.", path: ["SKIP_ENV_VALIDATION"] });
    return;
  }

  if (data.NODE_ENV === "production" && !data.DATABASE_URL) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "DATABASE_URL is required in production.", path: ["DATABASE_URL"] });
  }

  const required = data.NODE_ENV === "development" || data.NODE_ENV === "production";
  for (const name of SECRET_NAMES) addSecretIssue(context, name, data[name], required);
  if (data.BETTER_AUTH_SECRET?.trim() && data.BETTER_AUTH_SECRET.trim() === data.IP_HASH_SECRET?.trim()) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "BETTER_AUTH_SECRET and IP_HASH_SECRET must be different values.", path: ["BETTER_AUTH_SECRET"] });
    context.addIssue({ code: z.ZodIssueCode.custom, message: "BETTER_AUTH_SECRET and IP_HASH_SECRET must be different values.", path: ["IP_HASH_SECRET"] });
  }

  const fromAddress = data.EMAIL_FROM ? extractEmailAddress(data.EMAIL_FROM) : null;
  if (data.EMAIL_FROM && (!fromAddress || !z.string().email().safeParse(fromAddress).success)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "EMAIL_FROM must contain a valid email address.", path: ["EMAIL_FROM"] });
  }
  if (data.LEAD_NOTIFY_TO) {
    const recipients = splitEmailAddresses(data.LEAD_NOTIFY_TO);
    if (recipients.length === 0 || recipients.some((recipient) => !z.string().email().safeParse(recipient).success)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "LEAD_NOTIFY_TO must contain valid comma-separated email addresses.", path: ["LEAD_NOTIFY_TO"] });
    }
  }
  if (fromAddress && data.SMTP_USER && fromAddress.toLowerCase() !== data.SMTP_USER.toLowerCase()) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "EMAIL_FROM address must match SMTP_USER.", path: ["EMAIL_FROM"] });
  }
  if (data.NODE_ENV === "production") {
    const requiredEmailVariables = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM", "LEAD_NOTIFY_TO"] as const;
    for (const name of requiredEmailVariables) {
      const value = data[name];
      if (value === undefined || value === "") context.addIssue({ code: z.ZodIssueCode.custom, message: `${name} is required in production.`, path: [name] });
    }
    if (data.SMTP_SECURE === undefined) context.addIssue({ code: z.ZodIssueCode.custom, message: "SMTP_SECURE is required in production.", path: ["SMTP_SECURE"] });
  }
});

export function extractEmailAddress(value: string): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(/<([^<>\s]+)>$/);
  return (match?.[1] ?? trimmed).trim() || null;
}

export function splitEmailAddresses(value: string | undefined): string[] {
  return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

export function smtpConfigured(environment: Environment = getEnv()): boolean {
  return Boolean(environment.SMTP_HOST && environment.SMTP_PORT && environment.SMTP_USER && environment.SMTP_PASS && environment.EMAIL_FROM && environment.SMTP_SECURE !== undefined);
}

export function parseEnvironment(input: EnvironmentInput = process.env): ReturnType<typeof environmentSchema.safeParse> {
  return environmentSchema.safeParse(input);
}

export function formatEnvironmentIssues(error: z.ZodError): string[] {
  return [...new Set(error.issues.map((issue) => String(issue.path[0] ?? "environment")))];
}

function formatEnvironmentError(result: { error: z.ZodError }): Error {
  const names = formatEnvironmentIssues(result.error);
  return new Error(`Invalid environment variables: ${names.join(", ")}. Check your environment configuration.`);
}

let cachedEnvironment: Environment | undefined;

export function getEnv(): Environment {
  if (cachedEnvironment) return cachedEnvironment;
  const result = parseEnvironment();
  if (!result.success) throw formatEnvironmentError(result);
  cachedEnvironment = result.data;
  return cachedEnvironment;
}

export function getRequiredSecret(name: (typeof SECRET_NAMES)[number]): string {
  const value = getEnv()[name]?.trim();
  if (!value || value.length < MIN_SECRET_LENGTH || placeholderPattern.test(value)) {
    throw new Error(`${name} is required and must be a valid secret of at least ${MIN_SECRET_LENGTH} characters.`);
  }
  return value;
}

export const env = new Proxy({} as Environment, {
  get(_target, property: string): unknown {
    return getEnv()[property as keyof Environment];
  },
});

export { MIN_SECRET_LENGTH };
