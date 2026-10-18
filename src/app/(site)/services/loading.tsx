import { Container, Skeleton } from "@/components/ui";

export default function ServicesLoading() {
  return (
    <div aria-busy="true">
      <section className="section-dark pt-28"><Container className="pb-16"><Skeleton className="h-4 w-24 bg-white/20" /><Skeleton className="mt-5 h-12 max-w-2xl bg-white/20" /><Skeleton className="mt-4 h-6 max-w-xl bg-white/20" /></Container></section>
      <section className="section-tint"><Container className="section-space"><Skeleton className="h-8 w-64" /><Skeleton className="mt-3 h-5 w-full max-w-2xl" /><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="rounded-card border border-line bg-bg p-6"><Skeleton className="size-12 rounded-full" /><Skeleton className="mt-5 h-6 w-3/4" /><Skeleton className="mt-3 h-16 w-full" /></div>)}</div></Container></section>
    </div>
  );
}
