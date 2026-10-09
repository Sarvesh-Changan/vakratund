import { Container, Skeleton } from "@/components/ui";

export default function ServiceLoading() {
  return (
    <div aria-busy="true">
      <section className="bg-charcoal pt-28"><Container className="pb-14 lg:pb-20"><Skeleton className="h-4 w-48 bg-white/20" /><div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,28rem)]"><div><Skeleton className="size-14 bg-white/20" /><Skeleton className="mt-6 h-12 max-w-2xl bg-white/20" /><Skeleton className="mt-5 h-16 max-w-xl bg-white/20" /><Skeleton className="mt-8 h-12 w-44 bg-white/20" /></div><Skeleton className="aspect-[4/3] bg-white/20" /></div></Container></section>
      <Container className="py-14 lg:py-24"><div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]"><div className="space-y-12"><Skeleton className="h-8 w-64" /><Skeleton className="h-40 w-full" /><Skeleton className="h-8 w-52" /><Skeleton className="h-32 w-full" /></div><Skeleton className="h-64 w-full" /></div></Container>
    </div>
  );
}
