import { Container, Skeleton } from "@/components/ui";

export default function ContactLoading() {
  return <Container className="py-32"><Skeleton className="h-10 w-2/3" /><div className="mt-10 grid gap-8 lg:grid-cols-2"><Skeleton className="h-[34rem]" /><Skeleton className="h-80" /></div></Container>;
}
