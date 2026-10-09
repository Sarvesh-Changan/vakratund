import type { HomeStats } from "@/server/queries/home";
import { Container } from "@/components/ui/container";
import { CountUp } from "@/components/ui/count-up";
import { Reveal } from "@/components/ui/motion";

function StatValue({ value }: { value: string }) {
  const match = value.match(/^([\d,]+)(.*)$/);
  if (!match?.[1]) return <span>{value}</span>;
  return <span><CountUp value={Number(match[1].replaceAll(",", ""))} />{match[2]}</span>;
}

export function HomeStats({ stats }: { stats: HomeStats | null }) {
  if (!stats) return null;
  return <section className="border-b border-line bg-surface"><Container className="grid grid-cols-2 divide-x divide-y divide-line sm:grid-cols-4 sm:divide-y-0">{stats.items.map((item) => <Reveal key={`${item.label}-${item.value}`} className="px-4 py-6 text-center first:pl-0"><p className="font-heading text-2xl font-bold text-brand-deep"><StatValue value={item.value} /></p><p className="mt-1 text-xs text-ink-muted">{item.label}</p></Reveal>)}</Container></section>;
}
