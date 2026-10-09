import type { Metadata } from "next";
import { Container, Card, SectionHeading } from "@/components/ui";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";
import { BrochureForm } from "@/components/site/brochure-form";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/download/company-profile", fallbackTitle: "Download Company Profile", fallbackDescription: "Request the Vakratund Construction company profile.", noIndex: true });
}

export default function CompanyProfilePage() {
  const breadcrumbs = [{ name: "Home", item: "/" }, { name: "Company profile", item: "/download/company-profile" }] as const;
  return <><BreadcrumbJsonLd items={breadcrumbs} /><Container className="py-16 sm:py-24"><div className="mx-auto max-w-2xl"><Breadcrumbs items={breadcrumbs.map((item) => ({ label: item.name, href: item.item }))} /><h1 className="mt-8 font-heading text-4xl font-bold sm:text-5xl">Get the Vakratund Construction profile</h1><p className="mt-4 text-lg leading-8 text-ink-muted">Share your details and we will provide the configured company profile PDF.</p><Card className="mt-10 p-6 sm:p-8"><SectionHeading eyebrow="Company profile" title="Request the download" /><div className="mt-6"><BrochureForm /></div></Card></div></Container></>;
}
