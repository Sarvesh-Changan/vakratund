import { Container, Skeleton } from "@/components/ui";

export default function Loading() {
  return <div aria-busy="true"><section className="section-dark pt-28"><Container className="pb-16"><Skeleton className="h-12 w-2/3 bg-white/20" /><Skeleton className="mt-8 aspect-[4/3] w-full max-w-2xl rounded-card bg-white/20" /></Container></section><section className="section-light"><Container className="section-space"><Skeleton className="h-40 w-full rounded-card" /></Container></section></div>;
}
