import { smtpConfigured, splitEmailAddresses } from "../src/lib/env.ts";
import { createSmtpTransport } from "../src/lib/email/transport.ts";
import {
  loadStandaloneEnv,
  printEnvironmentLoadError,
  printValidationFailure,
  validateStandaloneEnvironment,
} from "../src/lib/standalone-env.ts";

try {
  const loaded = loadStandaloneEnv();
  const validation = validateStandaloneEnvironment(loaded.environment);
  if (!validation.success) {
    printValidationFailure(validation.error);
    process.exitCode = 1;
  } else {
    const environment = validation.data;
    if (!smtpConfigured(environment)) {
      console.log("SMTP_NOT_CONFIGURED");
      process.exitCode = 1;
    } else {
      const recipients = splitEmailAddresses(environment.LEAD_NOTIFY_TO);
      if (recipients.length === 0) {
        console.log("NO_VALID_RECIPIENT");
        process.exitCode = 1;
      } else {
        const transport = createSmtpTransport(environment);
        if (!transport) {
          console.log("SMTP_NOT_CONFIGURED");
          process.exitCode = 1;
        } else {
          try {
            await transport.sendMail({
              from: environment.EMAIL_FROM,
              to: recipients.join(","),
              subject: "[Vakratund] SMTP configuration test",
              html: "<p>This is a labelled SMTP configuration test for Vakratund Construction.</p>",
              text: "This is a labelled SMTP configuration test for Vakratund Construction.",
            });
            console.log("OK");
            process.exitCode = 0;
          } catch (error) {
            const code =
              error &&
              typeof error === "object" &&
              "code" in error &&
              typeof error.code === "string"
                ? error.code.replace(/[^A-Z0-9_]/gi, "_").toUpperCase()
                : "SMTP_SEND_FAILED";
            console.log(code || "SMTP_SEND_FAILED");
            process.exitCode = 1;
          } finally {
            transport.close();
          }
        }
      }
    }
  }
} catch {
  printEnvironmentLoadError(new Error("environment load failed"));
  process.exitCode = 1;
}
