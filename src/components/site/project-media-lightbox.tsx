"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";

import { CloudImage } from "@/components/cloud-image";
import { CloudVideoPoster } from "@/components/cloud-video-poster";
import { HoverCard, MaskImage, Reveal, RevealGroup } from "@/components/motion";
import { cloudinaryVideoPoster } from "@/lib/cloudinary/url";
import type { PublishedProjectMedia } from "@/server/queries/projects";

export function ProjectMediaLightbox({ media }: { media: PublishedProjectMedia[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const active = activeIndex === null ? null : (media[activeIndex] ?? null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (active && !dialog.open) {
      restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      closeRef.current?.focus();
    } else if (!active && dialog.open) {
      dialog.close();
      restoreFocusRef.current?.focus();
    }
  }, [active]);

  function step(direction: -1 | 1): void {
    if (activeIndex === null || media.length < 2) return;
    setActiveIndex((activeIndex + direction + media.length) % media.length);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>): void {
    if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); }
    if (event.key === "ArrowRight") { event.preventDefault(); step(1); }
  }

  return (
    <>
      <RevealGroup className="grid gap-5 sm:grid-cols-2">
        {media.map((item, index) => (
          <Reveal key={item.id}>
            <HoverCard className="group h-full rounded-card">
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                className="block h-full w-full overflow-hidden rounded-card border border-line bg-surface text-left shadow-soft focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                aria-label={`View project ${item.kind === "VIDEO" ? "video" : "image"}: ${item.alt}`}
              >
                <MaskImage>
                  <div className="relative aspect-[4/3] overflow-hidden bg-tint">
                    {item.kind === "VIDEO" ? (
                      <>
                        <CloudVideoPoster src={item.url} alt="" fill sizes="(min-width: 768px) 40vw, 100vw" data-hover-image className="object-cover transition-transform duration-500 group-hover:scale-105" />
                        <span className="absolute inset-0 flex items-center justify-center bg-dark/20">
                          <span className="flex size-14 items-center justify-center rounded-full bg-dark/80 text-white shadow-raised"><Play size={23} fill="currentColor" aria-hidden="true" /></span>
                        </span>
                        <span className="absolute left-3 top-3 rounded-pill bg-dark/80 px-3 py-1 text-xs font-semibold text-white">Video</span>
                      </>
                    ) : (
                      <CloudImage src={item.url} alt="" fill sizes="(min-width: 768px) 40vw, 100vw" data-hover-image className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}
                  </div>
                </MaskImage>
              </button>
            </HoverCard>
          </Reveal>
        ))}
      </RevealGroup>

      <dialog
        ref={dialogRef}
        aria-label="Project gallery viewer"
        onCancel={(event) => { event.preventDefault(); setActiveIndex(null); }}
        onKeyDown={handleKeyDown}
        onClick={(event) => { if (event.target === dialogRef.current) setActiveIndex(null); }}
        className="m-auto max-h-[92vh] w-[min(96vw,76rem)] max-w-none rounded-panel border border-white/15 bg-charcoal p-0 text-white shadow-raised backdrop:bg-charcoal/80"
      >
        {active ? (
          <div className="flex max-h-[92vh] flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-white/15 p-3 sm:px-5">
              <div className="min-w-0">
                <p className="truncate font-semibold">{active.alt || (active.kind === "VIDEO" ? "Project video" : "Project image")}</p>
                <p className="text-sm text-white/65">Project {active.kind === "VIDEO" ? "video" : "image"}</p>
              </div>
              <button ref={closeRef} type="button" onClick={() => setActiveIndex(null)} className="inline-flex size-11 items-center justify-center rounded-control text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-accent-2" aria-label="Close project gallery viewer"><X size={20} aria-hidden="true" /></button>
            </div>
            <div className="relative flex h-[min(76vh,60rem)] w-full items-center justify-center bg-dark p-3 sm:p-5">
              {active.kind === "VIDEO" ? (
                <video key={active.id} src={active.url} poster={cloudinaryVideoPoster(active.url)} controls playsInline preload="metadata" className="max-h-[72vh] max-w-full rounded-none object-contain" aria-label={active.alt || "Project video"} />
              ) : (
                <CloudImage src={active.url} alt={active.alt} fill sizes="(min-width: 1280px) 76vw, 94vw" className="object-contain" />
              )}
              {media.length > 1 ? (
                <>
                  <button type="button" onClick={() => step(-1)} className="absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-charcoal/85 text-white shadow-soft focus-visible:outline-2 focus-visible:outline-accent-2" aria-label="Previous project media"><ChevronLeft aria-hidden="true" /></button>
                  <button type="button" onClick={() => step(1)} className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-charcoal/85 text-white shadow-soft focus-visible:outline-2 focus-visible:outline-accent-2" aria-label="Next project media"><ChevronRight aria-hidden="true" /></button>
                </>
              ) : null}
            </div>
            <p className="border-t border-white/15 px-5 py-3 text-sm text-white/70" aria-live="polite">{(activeIndex ?? 0) + 1} of {media.length}</p>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
