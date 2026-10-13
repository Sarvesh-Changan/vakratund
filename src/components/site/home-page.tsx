import type { HomePageData } from "@/server/queries/home";
import { HomeEstimatorTeaser, HomeFinalCta } from "./home-ctas";
import { HomeFaq } from "./home-faq";
import { HomeHero } from "./home-hero";
import { HomeGallery } from "./home-gallery";
import { HomeProcess } from "./home-process";
import { HomeProjects } from "./home-projects";
import { HomeServices } from "./home-services";
import { HomeSocialProof } from "./home-social-proof";
import { HomeStats } from "./home-stats";
import { HomeTrust } from "./home-trust";

export function HomePage({ data }: { data: HomePageData }) {
  return <><HomeHero hero={data.hero} image={data.heroImage} settings={data.settings} /><HomeStats stats={data.stats} /><HomeServices services={data.services} /><HomeProjects projects={data.featuredProjects} /><HomeGallery items={data.featuredGallery} /><HomeProcess process={data.process} /><HomeTrust settings={data.settings} service={data.structuralService} team={data.team} /><HomeSocialProof testimonials={data.testimonials} /><HomeEstimatorTeaser /><HomeFaq faqs={data.faqs} /><HomeFinalCta cta={data.cta} /></>;
}
