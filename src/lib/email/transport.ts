import nodemailer from "nodemailer";

import type { Environment } from "../env";

export const SMTP_TIMEOUT_MS = 10_000;

export function createSmtpTransport(environment: Environment) {
  if (
    !environment.SMTP_HOST ||
    !environment.SMTP_PORT ||
    !environment.SMTP_USER ||
    !environment.SMTP_PASS ||
    environment.SMTP_SECURE === undefined
  )
    return null;
  return nodemailer.createTransport({
    host: environment.SMTP_HOST,
    port: environment.SMTP_PORT,
    secure: environment.SMTP_SECURE,
    pool: false,
    auth: { user: environment.SMTP_USER, pass: environment.SMTP_PASS },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  });
}
