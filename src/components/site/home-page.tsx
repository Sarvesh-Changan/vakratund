import type { HomePageData } from "@/server/queries/home";
import { HomeEstimatorTeaser, HomeFinalCta } from "./home-ctas";
import { HomeFaq } from "./home-faq";
import { HomeHero } from "./home-hero";
import { HomeCredibilityStrip } from "./home-credibility-strip";
import { HomeGallery } from "./home-gallery";
import { HomeProcess } from "./home-process";
import { HomeProjects } from "./home-projects";
import { HomeServices } from "./home-services";
import { HomeSocialProof } from "./home-social-proof";
import { HomeStats } from "./home-stats";
import { HomeWhy } from "./home-why";
import { HomeSpecialty } from "./home-specialty";
import { HomeLeadership } from "./home-leadership";
import { HomeWhereWeWork } from "./home-where-we-work";

export function HomePage({ data }: { data: HomePageData }) {
  return <>
    {data.heroVisible ? <HomeHero hero={data.hero} image={data.heroImage} gallery={data.featuredGallery} settings={data.settings} /> : null}
    {data.heroVisible ? <HomeCredibilityStrip hero={data.hero} settings={data.settings} services={data.services} /> : null}
    <HomeStats stats={data.stats} foundedYear={data.settings.foundedYear} teamSize={data.team.length} serviceCount={data.services.length} projectCount={data.publishedProjectCount} />
    <HomeServices services={data.services} section={data.servicesSection} />
    {data.projectsVisible ? <HomeProjects projects={data.featuredProjects} section={data.projectsSection} /> : null}
    <HomeWhereWeWork settings={data.settings} />
    {data.specialtyVisible || data.structuralService ? <HomeSpecialty section={data.specialtySection} service={data.structuralService} /> : null}
    <HomeProcess process={data.process} />
    <HomeGallery items={data.featuredGallery} />
    <HomeSocialProof testimonials={data.testimonials} />
    {data.whyVisible ? <HomeWhy team={data.team} section={data.whySection} /> : null}
    <HomeLeadership settings={data.settings} team={data.team} quote={data.whySection?.quote} />
    {data.estimatorVisible ? <HomeEstimatorTeaser section={data.estimatorSection} /> : null}
    {data.faqVisible ? <HomeFaq faqs={data.faqs} section={data.faqSection} /> : null}
    <HomeFinalCta cta={data.cta} settings={data.settings} />
  </>;
}
