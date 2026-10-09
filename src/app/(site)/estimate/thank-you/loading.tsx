import { Container, Skeleton } from "@/components/ui";

export default function EstimateThankYouLoading() {
  return <Container className="py-16 sm:py-24"><div className="mx-auto max-w-3xl"><Skeleton className="h-12 w-2/3" /><Skeleton className="mt-5 h-6 w-full" /><Skeleton className="mt-10 h-80" /></div></Container>;
}
