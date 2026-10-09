import { Link, Text } from "@react-email/components";

import { ActionButton, EmailShell, Field } from "./shared";

export type AdminLeadEmailData = {
  leadId: string;
  leadType: string;
  name: string;
  phone: string;
  email: string | null;
  location: string | null;
  message: string | null;
  sourcePage: string | null;
  isDuplicate: boolean;
  adminUrl: string;
  quote?: { serviceName: string; lowAmount: number; highAmount: number } | null;
};

export function AdminNewLeadEmail({ data }: { data: AdminLeadEmailData }) {
  return <EmailShell preview={`New ${data.leadType} lead from ${data.name}`} title="New lead received"><Text>A new enquiry is ready for follow-up.</Text><Field label="Lead type">{data.leadType}</Field><Field label="Name">{data.name}</Field><Field label="Phone"><Link href={`tel:${data.phone}`}>{data.phone}</Link></Field><Field label="Email">{data.email ?? "Not provided"}</Field><Field label="Location">{data.location ?? "Not provided"}</Field><Field label="Message">{data.message ?? "Not provided"}</Field><Field label="Source page">{data.sourcePage ?? "Not provided"}</Field>{data.quote ? <Field label="Estimate">{data.quote.serviceName}: ₹{data.quote.lowAmount.toLocaleString("en-IN")} – ₹{data.quote.highAmount.toLocaleString("en-IN")}</Field> : null}{data.isDuplicate ? <Text style={{ color: "#9a5f00", fontWeight: "700" }}>Duplicate flag: a recent lead used the same phone number.</Text> : null}<ActionButton href={`${data.adminUrl}/admin/leads/${encodeURIComponent(data.leadId)}`}>Open lead in admin</ActionButton></EmailShell>;
}
