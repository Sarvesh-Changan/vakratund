import { Container, Skeleton } from "@/components/ui";

export default function BlogArticleLoading() {
  return <div aria-busy="true"><section className="bg-charcoal pt-28"><Container className="pb-14 lg:pb-20"><Skeleton className="h-4 w-56 bg-white/20" /><Skeleton className="mt-10 h-14 max-w-4xl bg-white/20" /><Skeleton className="mt-5 h-16 max-w-3xl bg-white/20" /><Skeleton className="mt-10 aspect-[16/9] w-full bg-white/20" /></Container></section><Container className="py-14 lg:py-24"><div className="grid gap-12 lg:grid-cols-[minmax(0,68ch)_16rem]"><div><Skeleton className="h-6 w-32" /><Skeleton className="mt-8 h-[32rem] w-full" /></div><Skeleton className="h-64 w-full" /></div></Container></div>;
}
