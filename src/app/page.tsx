import type { Metadata } from "next";
import { HomePage } from "@/components/site/home-page";
import { SiteShell } from "@/components/site/site-shell";
import { buildMetadata } from "@/lib/seo/metadata";
import { getHomePageData } from "@/server/queries/home";
import { getPublicSeo } from "@/server/queries/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const [data, pageSeo] = await Promise.all([getHomePageData(), getPublicSeo("/").catch(() => null)]);
  return buildMetadata({ path: "/", fallbackTitle: "Civil Engineering, PMC & Turnkey Development", fallbackDescription: `${data.settings.businessName} provides civil engineering, project management, structural repair and turnkey construction services across Thane and Mumbai.`, pageSeo, siteName: data.settings.businessName });
}

export default async function Home() {
  const data = await getHomePageData();
  return <SiteShell settings={data.settings}><HomePage data={data} /></SiteShell>;
}
