import { Text } from "@react-email/components";

import { ActionButton, EmailShell } from "./shared";

export type PasswordResetEmailData = { name: string; resetUrl: string };

export function PasswordResetEmail({ data }: { data: PasswordResetEmailData }) { return <EmailShell preview="Reset your Vakratund admin password" title="Reset your password"><Text>Hello {data.name},</Text><Text>Use the button below to set a new password for your admin account. This link is time-limited and can be used once.</Text><ActionButton href={data.resetUrl}>Reset password</ActionButton><Text style={{ color: "#64736d", fontSize: "13px" }}>If you did not request this, you can safely ignore this email.</Text></EmailShell>; }
