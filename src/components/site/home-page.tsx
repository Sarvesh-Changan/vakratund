import type { HomePageData } from "@/server/queries/home";
import type { PublicHomeSlide } from "@/server/queries/home-slides";
import { HomeEstimatorTeaser, HomeFinalCta } from "./home-ctas";
import { HomeFaq } from "./home-faq";
import { HomeHero } from "./home-hero";
import { HomeCredibilityStrip } from "./home-credibility-strip";
import { HomeSlider } from "./home-slider";
import { HomeGallery } from "./home-gallery";
import { HomeSocialProof } from "./home-social-proof";
import { HomeWhy } from "./home-why";
import { HomeLeadership } from "./home-leadership";
import { HomeWhereWeWork } from "./home-where-we-work";

export function HomePage({ data, slides = [] }: { data: HomePageData; slides?: PublicHomeSlide[] }) {
  return <>
    {data.heroVisible ? <HomeHero hero={data.hero} image={data.heroImage} gallery={data.featuredGallery} settings={data.settings} /> : null}
    {data.heroVisible ? <HomeCredibilityStrip hero={data.hero} settings={data.settings} services={data.services} /> : null}
    {data.showcaseVisible ? <HomeSlider slides={slides} showcase={data.showcase} /> : null}
    <HomeWhereWeWork settings={data.settings} />
    <HomeGallery items={data.featuredGallery} />
    <HomeSocialProof testimonials={data.testimonials} />
    {data.whyVisible ? <HomeWhy team={data.team} section={data.whySection} /> : null}
    <HomeLeadership settings={data.settings} team={data.team} quote={data.whySection?.quote} />
    {data.estimatorVisible ? <HomeEstimatorTeaser section={data.estimatorSection} /> : null}
    {data.faqVisible ? <HomeFaq faqs={data.faqs} section={data.faqSection} /> : null}
    <HomeFinalCta cta={data.cta} settings={data.settings} />
  </>;
}
