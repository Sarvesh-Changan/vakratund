"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
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
  const isVideo = item.media.kind === "VIDEO" || Boolean(item.media.url.match(/\.(mp4|webm|mov)(\?.*)?$/i));
  if (isVideo) {
    const posterUrl = item.thumbnail?.url ?? undefined;
    return (
      <div className="flex w-full items-center justify-center overflow-hidden bg-black">
        <video
          src={item.media.url}
          controls
          playsInline
          poster={posterUrl}
          className="max-h-[72vh] w-full rounded-none object-contain"
          aria-label={item.media.alt || "Testimonial video"}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }
  return (
    <div className="flex w-full items-center justify-center overflow-hidden bg-black/90">
      <Image
        src={item.media.url}
        alt={item.media.alt || "Testimonial media"}
        width={item.media.width ?? 1200}
        height={item.media.height ?? 800}
        className="max-h-[72vh] w-full rounded-none object-contain"
        unoptimized
        priority
      />
    </div>
  );
}

export function TestimonialLightbox({ testimonial, initialMediaIndex = 0, onClose }: Props) {
  // Normalize media items: prioritize testimonial.media, fall back to legacy testimonial.photo
  const mediaList: PublishedTestimonialMedia[] = useMemo(() => {
    if (testimonial.media && testimonial.media.length > 0) {
      return testimonial.media;
    }
    if (testimonial.photo) {
      return [
        {
          id: `legacy-${testimonial.photo.id}`,
          mediaId: testimonial.photo.id,
          sortOrder: 0,
          thumbnailId: null,
          media: {
            id: testimonial.photo.id,
            kind: "IMAGE",
            url: testimonial.photo.url,
            alt: testimonial.photo.alt,
            width: testimonial.photo.width,
            height: testimonial.photo.height,
          },
          thumbnail: null,
        },
      ];
    }
    return [];
  }, [testimonial.media, testimonial.photo]);

  const hasMedia = mediaList.length > 0;
  const [mediaIndex, setMediaIndex] = useState(() => Math.min(initialMediaIndex, Math.max(0, mediaList.length - 1)));
  const currentMedia = mediaList[mediaIndex];
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const previous = useCallback(() => {
    if (mediaList.length <= 1) return;
    setMediaIndex((i) => (i - 1 + mediaList.length) % mediaList.length);
  }, [mediaList.length]);

  const next = useCallback(() => {
    if (mediaList.length <= 1) return;
    setMediaIndex((i) => (i + 1) % mediaList.length);
  }, [mediaList.length]);

  // Keyboard navigation + focus trap
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowLeft" && hasMedia && mediaList.length > 1) previous();
      if (e.key === "ArrowRight" && hasMedia && mediaList.length > 1) next();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prevFocus?.focus();
    };
  }, [hasMedia, next, onClose, previous, mediaList.length]);

  const { name, roleOrOrg, quote, rating, project } = testimonial;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Testimonial from ${name}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Rectangular modal card with clean subtle rounded corners */}
      <div
        ref={dialogRef}
        className={`relative flex max-h-[92vh] w-full overflow-hidden rounded-lg sm:rounded-xl border border-line/30 bg-surface shadow-2xl ${
          hasMedia ? "max-w-5xl flex-col lg:flex-row" : "max-w-xl flex-col"
        }`}
      >
        {/* Close button */}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close testimonial"
          className="absolute right-3 top-3 z-20 inline-flex size-9 items-center justify-center rounded-md bg-black/50 text-white hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <X size={18} aria-hidden="true" />
        </button>

        {/* ── Left: media (rectangular cinema panel) ─────────────────── */}
        {hasMedia && (
          <div className="relative flex flex-1 flex-col items-center justify-center bg-black p-2 sm:p-4 lg:max-w-[58%]">
            {currentMedia && (
              <div className="flex w-full items-center justify-center">
                <MediaSlide item={currentMedia} />
              </div>
            )}

            {/* Navigation between media items */}
            {mediaList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={previous}
                  aria-label="Previous media"
                  className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex size-10 items-center justify-center rounded-md bg-black/60 text-white hover:bg-black/80"
                >
                  <ChevronLeft size={22} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next media"
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex size-10 items-center justify-center rounded-md bg-black/60 text-white hover:bg-black/80"
                >
                  <ChevronRight size={22} aria-hidden="true" />
                </button>

                {/* Dot indicators */}
                <div className="mt-2 flex gap-1.5" aria-label={`${mediaIndex + 1} of ${mediaList.length}`} role="status">
                  {mediaList.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setMediaIndex(i)}
                      aria-label={`Media item ${i + 1}`}
                      className={`h-1.5 rounded-sm transition-all ${i === mediaIndex ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/60"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Right: testimonial text ───────────────────────────────── */}
        <div className={`flex flex-1 flex-col justify-center overflow-y-auto p-6 sm:p-8 lg:p-10 ${hasMedia ? "lg:max-w-[42%]" : "w-full"}`}>
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
