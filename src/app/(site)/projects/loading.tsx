import { Container, Skeleton } from "@/components/ui";

export default function Loading() {
  return <Container className="py-24"><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"><Skeleton className="aspect-[4/3]" /><Skeleton className="aspect-[4/3]" /><Skeleton className="aspect-[4/3]" /></div></Container>;
}
