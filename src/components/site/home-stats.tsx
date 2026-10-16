import type { HomeStats as HomeStatsContent } from "@/server/queries/home";
import { CountUp, Reveal } from "@/components/motion";
import { Container } from "@/components/ui/container";

function StatValue({ value }: { value: string }) {
  const match = value.match(/^(~?)([\d,]+)(.*)$/);
  if (!match?.[2]) return null;
  return <span><CountUp prefix={match[1]} value={Number(match[2].replaceAll(",", ""))} suffix={match[3]} /></span>;
}

export function HomeStats({ stats }: { stats: HomeStatsContent | null }) {
  const items = stats?.items.filter((item) => {
    const match = item.value.match(/^(~?)([\d,]+)/);
    return Boolean(match?.[2] && Number(match[2].replaceAll(",", "")) > 0);
  }) ?? [];
  if (items.length === 0) return null;

  return <section aria-label="Project facts" className="border-b border-line bg-surface-alt"><Container className="home-proof-grid py-5 sm:py-7">{items.map((item) => <Reveal key={`${item.label}-${item.value}`} className="rounded-card border border-line bg-surface px-4 py-5 text-center shadow-soft sm:px-5"><p className="font-heading text-2xl font-bold tabular-nums text-brand-deep sm:text-3xl"><StatValue value={item.value} /></p><p className="mx-auto mt-1 max-w-48 text-xs leading-5 text-ink-muted sm:text-sm">{item.label}</p></Reveal>)}</Container></section>;
}
