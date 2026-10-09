import { Text } from "@react-email/components";

import { ActionButton, EmailShell } from "./shared";

export type BrochureDeliveryEmailData = { name: string; downloadUrl: string };

export function BrochureDeliveryEmail({ data }: { data: BrochureDeliveryEmailData }) { return <EmailShell preview="Your Vakratund company profile is ready" title="Your company profile"><Text>Hello {data.name},</Text><Text>Thank you for your interest in M/s. Vakratund Construction. Your company profile is ready to download.</Text><ActionButton href={data.downloadUrl}>Download company profile</ActionButton><Text style={{ color: "#64736d", fontSize: "13px" }}>The download link is short-lived for your security.</Text></EmailShell>; }
