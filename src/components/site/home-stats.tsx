import type { HomeStats as HomeStatsContent } from "@/server/queries/home";
import { CountUp, Reveal } from "@/components/motion";
import { Container } from "@/components/ui/container";

function StatValue({ label, value }: { label: string; value: string }) {
  const match = value.match(/^(~?)([\d,]+)(.*)$/);
  if (!match?.[2]) return null;
  const number = Number(match[2].replaceAll(",", ""));
  const trailing = match[3] ?? "";
  const format = /since|established|year/i.test(label) ? "year" : /%$/.test(trailing) ? "percent" : "number";
  const suffix = format === "percent" ? "" : trailing;
  return <span><CountUp prefix={match[1]} value={number} suffix={suffix} format={format} /></span>;
}

export function HomeStats({ stats, foundedYear, teamSize, serviceCount, projectCount }: { stats: HomeStatsContent | null; foundedYear: number | null; teamSize: number; serviceCount: number; projectCount: number }) {
  const fallbackItems: HomeStatsContent["items"] = [
    { label: "Established", value: foundedYear === null ? "0" : String(foundedYear) },
    { label: "Team members", value: String(teamSize) },
    { label: "Published services", value: String(serviceCount) },
    { label: "Published projects", value: String(projectCount) },
  ];
  const items = stats && stats.items.length >= 4 ? stats.items.slice(0, 4) : fallbackItems;

  return <section aria-label="Project facts" className="section-tint border-b"><Container className="home-proof-grid py-5 sm:py-7">{items.map((item) => <Reveal key={`${item.label}-${item.value}`} className="rounded-card border border-line bg-bg px-4 py-5 text-center shadow-soft sm:px-5"><p className="font-heading text-2xl font-bold tabular-nums text-accent-ink sm:text-3xl"><StatValue label={item.label} value={item.value} /></p><p className="mx-auto mt-1 max-w-48 text-xs leading-5 text-ink-muted sm:text-sm">{item.label}</p></Reveal>)}</Container></section>;
}
