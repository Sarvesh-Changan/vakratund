import Link from "next/link";
import { ArrowRight, Building2, PhoneCall, Wrench } from "lucide-react";

const links = [
  { href: "/services", title: "Explore services", description: "Find the right construction, repair or rehabilitation service.", Icon: Wrench },
  { href: "/projects", title: "See our projects", description: "Browse published work and project details.", Icon: Building2 },
  { href: "/contact", title: "Talk to our team", description: "Share your requirement and choose the next useful step.", Icon: PhoneCall },
] as const;

export function PublicQuickLinks() {
  return <div className="grid gap-4 sm:grid-cols-3">{links.map(({ href, title, description, Icon }) => <Link key={href} href={href} className="group rounded-card border border-line bg-bg p-5 shadow-soft transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><span className="flex size-11 items-center justify-center rounded-full bg-accent/15 text-accent-ink"><Icon size={21} aria-hidden="true" /></span><h2 className="mt-5 font-heading text-lg font-semibold text-ink">{title}</h2><p className="mt-2 text-sm leading-6 text-ink-muted">{description}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent-ink">Open <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" /></span></Link>)}</div>;
}
