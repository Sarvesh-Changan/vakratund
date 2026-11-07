"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { TestimonialLightbox } from "@/components/site/testimonial-lightbox";
import type { PublishedTestimonial } from "@/server/queries/testimonials";

export function TestimonialsCarousel({ testimonials }: { testimonials: PublishedTestimonial[] }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState<PublishedTestimonial | null>(null);

  if (testimonials.length === 0) return null;
  const current = testimonials[index];
  if (!current) return null;

  const previous = () => setIndex((v) => (v - 1 + testimonials.length) % testimonials.length);
  const next = () => setIndex((v) => (v + 1) % testimonials.length);

  // Best thumbnail for the current item
  const thumb = (() => {
    const first = current.media[0];
    if (first?.thumbnail) return { url: first.thumbnail.url, alt: first.thumbnail.alt };
    if (first?.media.kind === "IMAGE") return { url: first.media.url, alt: first.media.alt };
    if (current.photo) return { url: current.photo.url, alt: current.photo.alt };
    return null;
  })();

  const hasMedia = current.media.length > 0 || current.photo !== null;

  return (
    <>
      <div
        className="mt-10"
        role="region"
        aria-roledescription="carousel"
        aria-label="Client testimonials"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "ArrowLeft") previous(); if (e.key === "ArrowRight") next(); }}
      >
        <div className="rounded-panel border bg-surface p-7 shadow-soft sm:p-10">
          {/* Thumbnail strip */}
          {thumb && (
            <button
              type="button"
              className="mb-6 overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-label={hasMedia ? `View media for ${current.name}` : undefined}
              onClick={() => { if (hasMedia) setLightbox(current); }}
            >
              <Image
                src={thumb.url}
                alt={thumb.alt}
                width={600}
                height={338}
                className="aspect-video w-full max-w-sm object-cover"
                unoptimized
              />
            </button>
          )}

          <Quote className="text-brand" size={30} aria-hidden="true" />
          <blockquote className="mt-5 max-w-3xl font-heading text-2xl font-semibold leading-tight">“{current.quote}”</blockquote>
          <div className="mt-7">
            <p className="font-semibold">{current.name}</p>
            {current.roleOrOrg ? <p className="text-sm text-ink-muted">{current.roleOrOrg}</p> : null}
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-ink-muted" aria-live="polite">{index + 1} of {testimonials.length}</p>
          <div className="flex gap-2">
            <button type="button" onClick={previous} aria-label="Previous testimonial" className="inline-flex size-11 items-center justify-center rounded-full border border-line hover:bg-surface-alt">
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button type="button" onClick={next} aria-label="Next testimonial" className="inline-flex size-11 items-center justify-center rounded-full border border-line hover:bg-surface-alt">
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {lightbox && (
        <TestimonialLightbox
          testimonial={lightbox}
          initialMediaIndex={0}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
