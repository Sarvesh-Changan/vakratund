import { Container, Skeleton } from "@/components/ui";

export default function Loading() {
  return <Container className="py-24"><div className="mx-auto max-w-3xl space-y-5"><Skeleton className="size-10 rounded-full" /><Skeleton className="h-4 w-32" /><Skeleton className="h-14 w-3/4" /><Skeleton className="h-24 w-full" /></div></Container>;
}
