import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ProjectEnquiryCta({ slug, title }: { slug: string; title: string }) {
  const query = new URLSearchParams({ project: title, projectSlug: slug }).toString();
  return <Link href={`/contact?${query}`} className="inline-flex min-h-12 items-center gap-2 rounded-control bg-brand px-5 font-bold text-brand-ink hover:bg-brand/90">Enquire about a similar project <ArrowRight size={18} aria-hidden="true" /></Link>;
}
