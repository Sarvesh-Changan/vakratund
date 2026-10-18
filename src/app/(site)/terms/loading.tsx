import { Container, Skeleton } from "@/components/ui";

export default function TermsLoading() {
  return <div aria-busy="true"><section className="section-dark pt-28"><Container className="pb-14"><Skeleton className="h-10 w-2/3 bg-white/20" /></Container></section><section className="section-light"><Container className="section-space"><div className="grid gap-12 lg:grid-cols-[12rem_minmax(0,68ch)]"><Skeleton className="h-32 rounded-card" /><Skeleton className="h-[30rem] rounded-card" /></div></Container></section></div>;
}
