import { Container, Skeleton } from "@/components/ui";

export default function ContactLoading() {
  return <div aria-busy="true"><section className="section-dark pt-28"><Container className="pb-16"><Skeleton className="h-10 w-2/3 bg-white/20" /><Skeleton className="mt-4 h-6 w-1/2 bg-white/20" /></Container></section><section className="section-light"><Container className="section-space"><div className="grid gap-8 lg:grid-cols-2"><Skeleton className="h-[34rem] rounded-card" /><Skeleton className="h-80 rounded-card" /></div></Container></section></div>;
}
