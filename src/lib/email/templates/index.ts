import { render } from "@react-email/render";

import { AdminNewLeadEmail, type AdminLeadEmailData } from "./admin-new-lead";
import { PasswordResetEmail, type PasswordResetEmailData } from "./password-reset";
import { VisitorConfirmationEmail, type VisitorConfirmationEmailData } from "./visitor-confirmation";

export { AdminNewLeadEmail, PasswordResetEmail, VisitorConfirmationEmail };
export type { AdminLeadEmailData, PasswordResetEmailData, VisitorConfirmationEmailData };

export async function renderTemplate(node: React.ReactNode): Promise<{ html: string; text: string }> {
  const html = await render(node);
  const text = await render(node, { plainText: true });
  return { html, text };
}
