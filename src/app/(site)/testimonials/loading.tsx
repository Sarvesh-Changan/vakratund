import { Container, Skeleton } from "@/components/ui";

export default function TestimonialsLoading() {
  return <div aria-busy="true"><section className="bg-charcoal pt-32"><Container className="pb-16"><Skeleton className="h-4 w-28 bg-white/20" /><Skeleton className="mt-5 h-12 max-w-2xl bg-white/20" /></Container></section><Container className="py-16 lg:py-24"><Skeleton className="h-8 w-56" /><div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-64" />)}</div></Container></div>;
}
