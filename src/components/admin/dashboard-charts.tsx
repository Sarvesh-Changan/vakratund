"use client";

import dynamic from "next/dynamic";

import type { CountEntry, LeadDayCount } from "@/server/services/dashboard";

const LeadCharts = dynamic(() => import("./lead-charts"), {
  ssr: false,
  loading: () => <div className="grid gap-6 xl:grid-cols-2"><div className="h-80 animate-pulse rounded-card border bg-surface-alt" /><div className="h-80 animate-pulse rounded-card border bg-surface-alt" /></div>,
});

export function DashboardCharts({ leadsByDay, leadsByStatus }: { leadsByDay: readonly LeadDayCount[]; leadsByStatus: readonly CountEntry[] }) {
  return <LeadCharts leadsByDay={leadsByDay} leadsByStatus={leadsByStatus} />;
}
