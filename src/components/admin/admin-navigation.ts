import type { Permission } from "@/config/permissions";

export interface AdminNavigationItem { label: string; href: string; permissions: readonly Permission[]; }

export const ADMIN_NAVIGATION: readonly AdminNavigationItem[] = [
  { label: "Dashboard", href: "/admin", permissions: ["dashboard:leads", "dashboard:content"] },
  { label: "Leads", href: "/admin/leads", permissions: ["leads:read"] },
  { label: "Quotes", href: "/admin/quotes", permissions: ["leads:read"] },
  { label: "Estimator", href: "/admin/estimator", permissions: ["estimator:write"] },
  { label: "Projects", href: "/admin/projects", permissions: ["content:write"] },
  { label: "Services", href: "/admin/services", permissions: ["content:write"] },
  { label: "Testimonials", href: "/admin/testimonials", permissions: ["content:write"] },
  { label: "FAQs", href: "/admin/faqs", permissions: ["content:write"] },
  { label: "Team", href: "/admin/team", permissions: ["content:write"] },
  { label: "Gallery", href: "/admin/gallery", permissions: ["content:write"] },
  { label: "SEO", href: "/admin/seo", permissions: ["seo:write"] },
  { label: "Activity", href: "/admin/activity", permissions: ["activity:read"] },
];
