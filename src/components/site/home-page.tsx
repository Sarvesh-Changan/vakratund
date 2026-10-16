import type { HomePageData } from "@/server/queries/home";
import { HomeEstimatorTeaser, HomeFinalCta } from "./home-ctas";
import { HomeFaq } from "./home-faq";
import { HomeHero } from "./home-hero";
import { HomeGallery } from "./home-gallery";
import { HomeProcess } from "./home-process";
import { HomeProjects } from "./home-projects";
import { HomeServiceMarquee, HomeServices } from "./home-services";
import { HomeSocialProof } from "./home-social-proof";
import { HomeStats } from "./home-stats";
import { HomeWhy } from "./home-why";
import { HomeSpecialty } from "./home-specialty";
import { HomeInsights } from "./home-insights";

export function HomePage({ data }: { data: HomePageData }) {
  return <>
    {data.heroVisible ? <HomeHero hero={data.hero} image={data.heroImage} settings={data.settings} /> : null}
    <HomeStats stats={data.stats} />
    {data.servicesVisible ? <HomeServices services={data.services} section={data.servicesSection} /> : null}
    {data.projectsVisible ? <HomeProjects projects={data.featuredProjects} section={data.projectsSection} /> : null}
    {data.whyVisible ? <HomeWhy settings={data.settings} team={data.team} section={data.whySection} /> : null}
    <HomeProcess process={data.process} />
    {data.specialtyVisible ? <HomeSpecialty section={data.specialtySection} service={data.structuralService} /> : null}
    {data.servicesVisible ? <HomeServiceMarquee services={data.services} /> : null}
    <HomeGallery items={data.featuredGallery} />
    <HomeSocialProof testimonials={data.testimonials} />
    {data.insightsVisible ? <HomeInsights posts={data.latestInsights} section={data.insightsSection} /> : null}
    {data.estimatorVisible ? <HomeEstimatorTeaser section={data.estimatorSection} /> : null}
    {data.faqVisible ? <HomeFaq faqs={data.faqs} section={data.faqSection} /> : null}
    <HomeFinalCta cta={data.cta} settings={data.settings} />
  </>;
}
