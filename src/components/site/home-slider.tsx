import { Container } from "@/components/ui/container";
import { Marquee } from "@/components/motion/marquee";
import { CloudImage } from "@/components/cloud-image";
import type { PublicHomeSlide } from "@/server/queries/home-slides";
import type { HomeShowcase } from "@/server/queries/home";

export interface HomeSliderProps {
  slides: PublicHomeSlide[];
  showcase?: HomeShowcase | null;
}

const SPEED_MAP = {
  slow: 30,
  normal: 50,
  fast: 80,
} as const;

function SlideCard({
  slide,
  priority = false,
}: {
  slide: PublicHomeSlide;
  priority?: boolean;
}) {
  const content = (
    <>
      <CloudImage
        src={slide.media.url}
        alt={slide.alt}
        fill
        sizes="(min-width: 1024px) 380px, (min-width: 640px) 320px, 240px"
        priority={priority}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {slide.title ? (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-dark/85 via-dark/40 to-transparent p-3 text-white">
          <p className="line-clamp-1 text-xs font-semibold sm:text-sm drop-shadow-sm">
            {slide.title}
          </p>
          {slide.caption ? (
            <p className="line-clamp-1 text-[11px] text-white/80 drop-shadow-sm">
              {slide.caption}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );

  const cardClasses =
    "group relative block aspect-[4/3] h-[180px] sm:h-[240px] lg:h-[280px] shrink-0 overflow-hidden rounded-panel border border-line bg-tint shadow-soft transition-transform duration-300 hover:scale-[1.04]";

  if (slide.linkUrl) {
    return (
      <a
        href={slide.linkUrl}
        className={cardClasses}
        aria-label={slide.title || slide.alt}
      >
        {content}
      </a>
    );
  }

  return (
    <div className={cardClasses} aria-label={slide.alt}>
      {content}
    </div>
  );
}

export function HomeSlider({ slides, showcase }: HomeSliderProps) {
  // Hide section entirely if fewer than 4 active slides
  if (!slides || slides.length < 4) {
    return null;
  }

  const speedPx = SPEED_MAP[showcase?.speed ?? "normal"] ?? 50;
  const pauseOnHover = showcase?.pauseOnHover ?? true;
  const hasHeading = Boolean(showcase?.eyebrow?.trim() || showcase?.heading?.trim());

  // Static responsive grid for 4 to 6 slides
  if (slides.length <= 6) {
    return (
      <section
        aria-label="Photo gallery"
        className="section-tint border-b py-12 sm:py-16"
      >
        <Container>
          {hasHeading ? (
            <div className="mb-8 text-center">
              {showcase?.eyebrow ? (
                <p className="eyebrow mb-2 text-accent-ink">{showcase.eyebrow}</p>
              ) : null}
              {showcase?.heading ? (
                <h2 className="font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  {showcase.heading}
                </h2>
              ) : null}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {slides.map((slide, index) => (
              <SlideCard key={slide.id} slide={slide} priority={index < 2} />
            ))}
          </div>
        </Container>
      </section>
    );
  }

  // 7+ slides: Marquee continuous moving strip
  // If 10 or more slides, generate second row with offset starting order
  const secondRowSlides =
    slides.length >= 10
      ? [
          ...slides.slice(Math.floor(slides.length / 2)),
          ...slides.slice(0, Math.floor(slides.length / 2)),
        ]
      : [];

  return (
    <section
      aria-label="Project photo showcase"
      className="section-tint overflow-hidden border-b py-10 sm:py-14"
    >
      {hasHeading ? (
        <Container className="mb-6 text-center">
          {showcase?.eyebrow ? (
            <p className="eyebrow mb-2 text-accent-ink">{showcase.eyebrow}</p>
          ) : null}
          {showcase?.heading ? (
            <h2 className="font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {showcase.heading}
            </h2>
          ) : null}
        </Container>
      ) : null}

      <div className="space-y-4">
        {/* First Row (Left moving) */}
        <Marquee
          speed={speedPx}
          direction="left"
          gap={16}
          pauseOnHover={pauseOnHover}
          showPauseButton={true}
          label="Project photos showcase row 1"
          fixedHeightClass="h-[180px] sm:h-[240px] lg:h-[280px]"
        >
          {slides.map((slide, index) => (
            <SlideCard key={`r1-${slide.id}`} slide={slide} priority={index < 2} />
          ))}
        </Marquee>

        {/* Second Row on Desktop (Right moving, opposite direction) for 10+ slides */}
        {secondRowSlides.length >= 10 ? (
          <div className="hidden lg:block">
            <Marquee
              speed={speedPx}
              direction="right"
              gap={16}
              pauseOnHover={pauseOnHover}
              showPauseButton={false}
              label="Project photos showcase row 2"
              fixedHeightClass="h-[280px]"
            >
              {secondRowSlides.map((slide) => (
                <SlideCard key={`r2-${slide.id}`} slide={slide} priority={false} />
              ))}
            </Marquee>
          </div>
        ) : null}
      </div>
    </section>
  );
}

