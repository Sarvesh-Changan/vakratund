import { Container, Skeleton } from "@/components/ui";

export default function Loading() {
  return <section className="section-light"><Container className="section-space"><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"><Skeleton className="aspect-[4/3] rounded-card" /><Skeleton className="aspect-[4/3] rounded-card" /><Skeleton className="aspect-[4/3] rounded-card" /></div></Container></section>;
}
