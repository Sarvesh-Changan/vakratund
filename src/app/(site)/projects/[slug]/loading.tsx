import { Container, Skeleton } from "@/components/ui";

export default function Loading() {
  return <Container className="py-24"><div className="space-y-8"><Skeleton className="h-12 w-2/3" /><Skeleton className="aspect-[4/3] w-full max-w-2xl" /><Skeleton className="h-40 w-full" /></div></Container>;
}
