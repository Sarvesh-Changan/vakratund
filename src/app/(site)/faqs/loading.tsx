import { Container, Skeleton } from "@/components/ui";

export default function FaqsLoading() {
  return <div aria-busy="true"><section className="bg-charcoal pt-32"><Container className="pb-16"><Skeleton className="h-4 w-20 bg-white/20" /><Skeleton className="mt-5 h-12 max-w-2xl bg-white/20" /></Container></section><Container className="py-16 lg:py-24"><Skeleton className="h-8 w-64" /><div className="mt-6 space-y-3">{Array.from({ length: 7 }, (_, index) => <Skeleton key={index} className="h-16 w-full" />)}</div></Container></div>;
}
