"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Quote, Star, X } from "lucide-react";
import { Badge } from "@/components/ui";
import type { PublishedTestimonial, PublishedTestimonialMedia } from "@/server/queries/testimonials";

type Props = {
  testimonial: PublishedTestimonial;
  initialMediaIndex?: number;
  onClose: () => void;
};

function MediaSlide({ item }: { item: PublishedTestimonialMedia }) {
  const isVideo = item.media.kind === "VIDEO";
  if (isVideo) {
    const posterUrl = item.thumbnail?.url ?? undefined;
    return (
      <video
        src={item.media.url}
        controls
        poster={posterUrl}
        className="max-h-[70vh] w-full rounded-control object-contain"
        aria-label={item.media.alt}
      />
    );
  }
  return (
    <Image
      src={item.media.url}
      alt={item.media.alt}
      width={item.media.width ?? 800}
      height={item.media.height ?? 600}
      className="max-h-[70vh] w-full rounded-control object-contain"
      unoptimized
      priority
    />
  );
}

export function TestimonialLightbox({ testimonial, initialMediaIndex = 0, onClose }: Props) {
  const [mediaIndex, setMediaIndex] = useState(initialMediaIndex);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const hasMedia = testimonial.media.length > 0;
  const currentMedia = testimonial.media[mediaIndex];

  const previous = useCallback(() => {
    setMediaIndex((i) => (i - 1 + testimonial.media.length) % testimonial.media.length);
  }, [testimonial.media.length]);

  const next = useCallback(() => {
    setMediaIndex((i) => (i + 1) % testimonial.media.length);
  }, [testimonial.media.length]);

  // Keyboard navigation + focus trap
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowLeft" && hasMedia && testimonial.media.length > 1) previous();
      if (e.key === "ArrowRight" && hasMedia && testimonial.media.length > 1) next();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prevFocus?.focus();
    };
  }, [hasMedia, next, onClose, previous, testimonial.media.length]);

  const { name, roleOrOrg, quote, rating, project } = testimonial;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Testimonial from ${name}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-panel bg-surface shadow-2xl lg:flex-row"
      >
        {/* Close button */}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close testimonial"
          className="absolute right-3 top-3 z-10 inline-flex size-9 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <X size={18} aria-hidden="true" />
        </button>

        {/* ── Left: media ───────────────────────────────────────────── */}
        {hasMedia ? (
          <div className="relative flex flex-1 flex-col items-center justify-center bg-charcoal p-4 lg:max-w-[55%]">
            {currentMedia && (
              <div className="w-full">
                <MediaSlide item={currentMedia} />
              </div>
            )}

            {/* Navigation between media items */}
            {testimonial.media.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={previous}
                  aria-label="Previous media"
                  className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex size-10 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
                >
                  <ChevronLeft size={20} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next media"
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex size-10 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
                >
                  <ChevronRight size={20} aria-hidden="true" />
                </button>

                {/* Dot indicators */}
                <div className="mt-3 flex gap-1.5" aria-label={`${mediaIndex + 1} of ${testimonial.media.length}`} role="status">
                  {testimonial.media.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setMediaIndex(i)}
                      aria-label={`Media item ${i + 1}`}
                      className={`size-2 rounded-full transition-colors ${i === mediaIndex ? "bg-white" : "bg-white/40 hover:bg-white/60"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          // No media: left panel shows a decorative quote mark background
          <div className="hidden items-center justify-center bg-charcoal lg:flex lg:max-w-[45%] lg:flex-1">
            <Quote size={80} className="text-white/10" aria-hidden="true" />
          </div>
        )}

        {/* ── Right: testimonial text ───────────────────────────────── */}
        <div className="flex flex-1 flex-col justify-center overflow-y-auto p-7 lg:max-w-[45%]">
          <Quote className="text-brand-deep" size={28} aria-hidden="true" />
          <blockquote className="mt-4 text-lg leading-8 text-ink">“{quote}”</blockquote>
          <div className="mt-6 border-t border-line pt-5">
            <p className="font-semibold">{name}</p>
            {roleOrOrg ? <p className="mt-1 text-sm text-ink-muted">{roleOrOrg}</p> : null}
            {rating !== null ? (
              <div className="mt-3 flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={16} className={i < rating ? "fill-brand text-brand-deep" : "text-line"} aria-hidden="true" />
                ))}
                <Badge className="ml-2">{rating}/5</Badge>
              </div>
            ) : null}
            {project ? <p className="mt-3 text-xs text-ink-muted">Project: {project.title}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
