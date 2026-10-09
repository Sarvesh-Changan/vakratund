import { Container, Skeleton } from "@/components/ui";

export default function Loading() {
  return <Container className="py-24"><div className="mx-auto max-w-2xl space-y-5"><Skeleton className="h-5 w-40" /><Skeleton className="h-14 w-3/4" /><Skeleton className="h-80 w-full" /></div></Container>;
}
