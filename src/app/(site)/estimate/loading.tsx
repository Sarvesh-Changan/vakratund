import { Container, Skeleton } from "@/components/ui";

export default function EstimateLoading() {
  return <Container className="py-12 sm:py-16"><div className="space-y-8"><Skeleton className="h-16" /><div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]"><Skeleton className="h-[32rem]" /><Skeleton className="h-80" /></div></div></Container>;
}
