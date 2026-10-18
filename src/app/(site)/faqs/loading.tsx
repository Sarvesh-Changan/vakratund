import { Container, Skeleton } from "@/components/ui";

export default function FaqsLoading() {
  return <div aria-busy="true"><section className="section-dark pt-28"><Container className="pb-16"><Skeleton className="h-4 w-20 bg-white/20" /><Skeleton className="mt-5 h-12 max-w-2xl bg-white/20" /></Container></section><section className="section-light"><Container className="section-space"><Skeleton className="h-8 w-64" /><div className="mt-6 space-y-3">{Array.from({ length: 7 }, (_, index) => <Skeleton key={index} className="h-16 w-full rounded-card" />)}</div></Container></section></div>;
}
