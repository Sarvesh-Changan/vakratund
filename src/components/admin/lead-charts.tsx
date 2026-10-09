"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { CountEntry, LeadDayCount } from "@/server/services/dashboard";

export default function LeadCharts({ leadsByDay, leadsByStatus }: { leadsByDay: readonly LeadDayCount[]; leadsByStatus: readonly CountEntry[] }) {
  return <div className="grid gap-6 xl:grid-cols-2">
    <div className="rounded-card border bg-surface p-4" aria-labelledby="leads-over-time-title">
      <h2 id="leads-over-time-title" className="mb-4 text-lg font-semibold text-ink">Leads over time</h2>
      <div className="h-72 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={leadsByDay} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fill: "var(--ink-muted)", fontSize: 11 }} tickFormatter={(value: string) => value.slice(5)} />
            <YAxis allowDecimals={false} tick={{ fill: "var(--ink-muted)", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "var(--surface)", borderColor: "var(--line)", color: "var(--ink)" }} />
            <Line type="monotone" dataKey="count" name="Leads" stroke="var(--brand-deep)" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
    <div className="rounded-card border bg-surface p-4" aria-labelledby="leads-by-status-title">
      <h2 id="leads-by-status-title" className="mb-4 text-lg font-semibold text-ink">Leads by status</h2>
      <div className="h-72 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={leadsByStatus} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fill: "var(--ink-muted)", fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fill: "var(--ink-muted)", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "var(--surface)", borderColor: "var(--line)", color: "var(--ink)" }} />
            <Legend />
            <Bar dataKey="count" name="Leads" fill="var(--brand)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>;
}
