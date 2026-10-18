import { Container, Skeleton } from "@/components/ui";

export default function BlogLoading() {
  return <div aria-busy="true"><section className="section-dark pt-28"><Container className="pb-16"><Skeleton className="h-4 w-24 bg-white/20" /><Skeleton className="mt-5 h-12 max-w-2xl bg-white/20" /><Skeleton className="mt-4 h-6 max-w-xl bg-white/20" /></Container></section><section className="section-tint"><Container className="section-space"><Skeleton className="h-12 w-full rounded-pill" /><Skeleton className="mt-12 h-8 w-56" /><div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-96 rounded-card" />)}</div></Container></section></div>;
}
