import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

export function EmailShell({ preview, title, children }: { preview: string; title: string; children: ReactNode }) {
  return <Html><Head /><Preview>{preview}</Preview><Body style={{ backgroundColor: "#f5f7f6", color: "#18221f", fontFamily: "Arial, sans-serif", margin: 0, padding: "24px 0" }}><Container style={{ backgroundColor: "#ffffff", margin: "0 auto", maxWidth: "640px", padding: "32px" }}><Heading as="h1" style={{ color: "#153f35", fontSize: "24px", margin: "0 0 24px" }}>{title}</Heading>{children}<Hr style={{ borderColor: "#d9e2de", margin: "28px 0 16px" }} /><Text style={{ color: "#64736d", fontSize: "12px", lineHeight: "18px" }}>M/s. Vakratund Construction · Thane and Mumbai</Text></Container></Body></Html>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) { return <Section style={{ marginBottom: "12px" }}><Text style={{ color: "#64736d", fontSize: "12px", fontWeight: "700", margin: "0 0 4px" }}>{label}</Text><Text style={{ fontSize: "15px", lineHeight: "22px", margin: 0 }}>{children}</Text></Section>; }

export function ActionButton({ href, children }: { href: string; children: ReactNode }) { return <Section style={{ margin: "24px 0" }}><a href={href} style={{ backgroundColor: "#e5b94f", borderRadius: "6px", color: "#18221f", display: "inline-block", fontSize: "14px", fontWeight: "700", padding: "12px 18px", textDecoration: "none" }}>{children}</a></Section>; }
