import { Container, Skeleton } from "@/components/ui";

export default function TermsLoading() {
  return <Container className="py-32"><Skeleton className="h-10 w-2/3" /><Skeleton className="mt-8 h-[30rem] w-full" /></Container>;
}
