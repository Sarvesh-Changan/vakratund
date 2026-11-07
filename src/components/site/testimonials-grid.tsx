"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, Quote, Star } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { TestimonialLightbox } from "@/components/site/testimonial-lightbox";
import type { PublishedTestimonial } from "@/server/queries/testimonials";

type Props = {
  testimonials: PublishedTestimonial[];
};

/** Returns the best image to use as a card thumbnail */
function cardThumbnail(t: PublishedTestimonial): { url: string; alt: string; isVideo: boolean } | null {
  // First: check new media array
  const first = t.media[0];
  if (first) {
    // If a custom thumbnail was uploaded for this item (image or video), prioritize it
    if (first.thumbnail) {
      return { url: first.thumbnail.url, alt: first.thumbnail.alt, isVideo: first.media.kind === "VIDEO" };
    }
    if (first.media.kind === "IMAGE") {
      return { url: first.media.url, alt: first.media.alt, isVideo: false };
    }
    return null; // Video without thumbnail → play icon
  }
  // Fallback: legacy single photo
  if (t.photo) return { url: t.photo.url, alt: t.photo.alt, isVideo: false };
  return null;
}

export function TestimonialsGrid({ testimonials }: Props) {
  const [lightbox, setLightbox] = useState<{ testimonial: PublishedTestimonial; mediaIndex: number } | null>(null);

  if (testimonials.length === 0) return null;

  return (
    <>
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial) => {
          const { rating, media } = testimonial;
          const thumb = cardThumbnail(testimonial);
          const hasMedia = media.length > 0 || testimonial.photo !== null;
          const firstIsVideo = media[0]?.media.kind === "VIDEO";

          return (
            <Card
              key={testimonial.id}
              className={`flex h-full flex-col${hasMedia ? " cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" : ""}`}
              // Make card clickable if it has media
              {...(hasMedia
                ? {
                    role: "button",
                    tabIndex: 0,
                    "aria-label": `View media for testimonial from ${testimonial.name}`,
                    onClick: () => setLightbox({ testimonial, mediaIndex: 0 }),
                    onKeyDown: (e: React.KeyboardEvent) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setLightbox({ testimonial, mediaIndex: 0 });
                      }
                    },
                  }
                : {})}
            >
              {/* Thumbnail */}
              {thumb ? (
                <div className="relative -mx-5 -mt-5 mb-5 aspect-video overflow-hidden rounded-t-panel bg-surface-alt">
                  <Image
                    src={thumb.url}
                    alt={thumb.alt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                    unoptimized
                  />
                  {/* Play badge for videos */}
                  {(firstIsVideo || thumb.isVideo) && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="inline-flex size-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
                        <Play size={22} className="ml-0.5" aria-hidden="true" />
                      </span>
                    </span>
                  )}
                  {/* Multiple media indicator */}
                  {media.length > 1 && (
                    <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                      1/{media.length}
                    </span>
                  )}
                </div>
              ) : firstIsVideo ? (
                // Video with no thumbnail
                <div className="relative -mx-5 -mt-5 mb-5 flex aspect-video items-center justify-center rounded-t-panel bg-charcoal">
                  <Play size={36} className="text-white/60" aria-hidden="true" />
                  {media.length > 1 && (
                    <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white">
                      1/{media.length}
                    </span>
                  )}
                </div>
              ) : null}

              <Quote className="text-brand-deep" size={28} aria-hidden="true" />
              <blockquote className="mt-5 flex-1 text-lg leading-8 text-ink">“{testimonial.quote}”</blockquote>
              <div className="mt-7 border-t border-line pt-5">
                <p className="font-semibold">{testimonial.name}</p>
                {testimonial.roleOrOrg ? <p className="mt-1 text-sm text-ink-muted">{testimonial.roleOrOrg}</p> : null}
                {rating !== null ? (
                  <div className="mt-3 flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} size={16} className={i < rating ? "fill-brand text-brand-deep" : "text-line"} aria-hidden="true" />
                    ))}
                    <Badge className="ml-2">{rating}/5</Badge>
                  </div>
                ) : null}
                {testimonial.project ? <p className="mt-3 text-xs text-ink-muted">Project: {testimonial.project.title}</p> : null}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <TestimonialLightbox
          testimonial={lightbox.testimonial}
          initialMediaIndex={lightbox.mediaIndex}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
