import { Link, Text } from "@react-email/components";

import { EmailShell, Field } from "./shared";

export type VisitorConfirmationEmailData = {
  name: string;
  summary: string;
  phones: string[];
  whatsappUrl: string;
  quote?: { serviceName: string; lowAmount: number; highAmount: number } | null;
};

export function VisitorConfirmationEmail({ data }: { data: VisitorConfirmationEmailData }) {
  return <EmailShell preview="We received your Vakratund enquiry" title={`Thank you, ${data.name}`}><Text>We received your enquiry successfully.</Text><Field label="Your enquiry">{data.summary}</Field>{data.quote ? <Field label="Indicative estimate">{data.quote.serviceName}: ₹{data.quote.lowAmount.toLocaleString("en-IN")} – ₹{data.quote.highAmount.toLocaleString("en-IN")}</Field> : null}{data.quote ? <Text style={{ color: "#64736d", fontSize: "13px" }}>Indicative estimate. Final quotation after site inspection.</Text> : null}<Text style={{ fontWeight: "700", marginTop: "20px" }}>What happens next</Text><Text>Our team will review the details and contact you to discuss the next steps.</Text><Text>Call us: {data.phones.map((phone, index) => <span key={phone}>{index ? " / " : ""}<Link href={`tel:${phone}`}>{phone}</Link></span>)}</Text><Text><Link href={data.whatsappUrl}>Chat on WhatsApp</Link><br />{data.whatsappUrl}</Text></EmailShell>;
}
