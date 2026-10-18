import { Container, Skeleton } from "@/components/ui";

export default function EstimateLoading() {
  return <section className="section-light"><Container className="section-space"><div className="space-y-8"><Skeleton className="h-16 rounded-card" /><div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]"><Skeleton className="h-[32rem] rounded-card" /><Skeleton className="h-80 rounded-card" /></div></div></Container></section>;
}
