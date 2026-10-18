import { Container, Skeleton } from "@/components/ui";

export default function EstimateThankYouLoading() {
  return <div aria-busy="true"><section className="section-gradient"><Container className="section-space"><div className="mx-auto max-w-3xl"><Skeleton className="size-12 rounded-full" /><Skeleton className="mt-5 h-12 w-2/3" /><Skeleton className="mt-5 h-6 w-full" /></div></Container></section><section className="section-light"><Container className="section-space"><div className="mx-auto max-w-3xl"><Skeleton className="h-80 rounded-card" /></div></Container></section></div>;
}
