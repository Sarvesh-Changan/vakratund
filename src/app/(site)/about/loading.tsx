import { Container, Skeleton } from "@/components/ui";

export default function AboutLoading() {
  return <div aria-busy="true"><section className="bg-charcoal pt-32"><Container className="pb-16"><Skeleton className="h-4 w-24 bg-white/20" /><Skeleton className="mt-5 h-12 max-w-2xl bg-white/20" /><Skeleton className="mt-4 h-6 max-w-xl bg-white/20" /></Container></section><Container className="py-16 lg:py-24"><div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]"><div><Skeleton className="h-8 w-56" /><Skeleton className="mt-6 h-40 w-full" /></div><Skeleton className="h-64 w-full" /></div><Skeleton className="mt-20 h-8 w-64" /><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-80" />)}</div></Container></div>;
}
