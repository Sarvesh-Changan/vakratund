"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, FolderOpen, Play, X } from "lucide-react";
import Link from "next/link";
import { CloudImage } from "@/components/cloud-image";
import { CloudVideoPoster } from "@/components/cloud-video-poster";
import { HoverCard, MaskImage, Reveal, RevealGroup } from "@/components/motion";
import { cloudinaryVideoPoster } from "@/lib/cloudinary/url";
import { Button } from "@/components/ui";
import type { PublishedGalleryCategory, PublishedGalleryItem } from "@/server/queries/gallery";

export type GalleryCategoryCollection = { category: PublishedGalleryCategory; year?: number; items: PublishedGalleryItem[]; cover: PublishedGalleryCategory["cover"] };

export function GalleryLightbox({ items, categories, categoryBaseHref }: { items: PublishedGalleryItem[]; categories?: GalleryCategoryCollection[]; categoryBaseHref?: string }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const touchStartRef = useRef<number | null>(null);
  const active = activeIndex === null ? null : (items[activeIndex] ?? null);

  function closeViewer(): void {
    setActiveIndex(null);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (active && !dialog.open) {
      restoreFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      dialog.showModal();
      closeRef.current?.focus();
    } else if (!active && dialog.open) {
      dialog.close();
      restoreFocusRef.current?.focus();
    }
  }, [active]);

  function step(direction: -1 | 1): void {
    if (items.length < 2 || activeIndex === null) return;
    setActiveIndex((activeIndex + direction + items.length) % items.length);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>): void {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    }
  }

  function touchEnd(x: number): void {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (start === null || Math.abs(x - start) < 48) return;
    step(x < start ? 1 : -1);
  }

  return (
    <>
      <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories ? categories.map((collection) => (
          <Reveal key={collection.category.id}>
            <HoverCard className="h-full rounded-card">
              <Link
                className="group relative block aspect-[4/3] w-full overflow-hidden rounded-card border border-line bg-dark text-left shadow-soft focus-visible:outline-2 focus-visible:outline-brand-deep focus-visible:outline-offset-2"
                href={categoryBaseHref ? `${categoryBaseHref}${encodeURIComponent(collection.category.slug)}` : "#"}
                aria-label={`Browse ${collection.category.name} gallery, ${collection.items.length} ${collection.items.length === 1 ? "item" : "items"}`}
              >
                <div className="absolute inset-0 bg-dark">
                  {collection.cover.mediaType === "VIDEO" ? <CloudVideoPoster src={collection.cover.url} alt={collection.cover.alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" /> : <CloudImage src={collection.cover.url} alt={collection.cover.alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/35 to-transparent" aria-hidden="true" />
                <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-pill border border-white/20 bg-dark/65 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm"><FolderOpen size={14} aria-hidden="true" />{collection.items.length} {collection.items.length === 1 ? "item" : "items"}</span>
                <span className="absolute inset-x-5 bottom-5 text-white sm:inset-x-6 sm:bottom-6"><span className="block font-heading text-2xl font-semibold sm:text-3xl">{collection.category.name}</span>{collection.year ? <span className="mt-1 block text-sm text-white/75">{collection.year}</span> : null}<span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-white/85">Browse collection <ArrowRight size={16} aria-hidden="true" /></span></span>
              </Link>
            </HoverCard>
          </Reveal>
        )) : items.map((item, index) => (
          <Reveal key={item.id}>
            <HoverCard className="h-full rounded-card">
              <button
                type="button"
                className="group w-full overflow-hidden rounded-card border bg-surface text-left shadow-soft focus-visible:outline-2 focus-visible:outline-brand-deep focus-visible:outline-offset-2"
                onClick={() => setActiveIndex(index)}
                aria-label={`View ${item.title}${item.mediaType === "VIDEO" ? " video" : " image"}`}
              >
                <MaskImage>
                  <div className="relative aspect-[4/3] bg-surface-alt">
                    {item.mediaType === "VIDEO" ? (
                      <>
                        <CloudVideoPoster
                          src={item.url}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          data-hover-image
                          className="object-cover"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-charcoal/20">
                          <span className="flex size-12 items-center justify-center rounded-full bg-charcoal/80 text-white">
                            <Play
                              size={22}
                              fill="currentColor"
                              aria-hidden="true"
                            />
                          </span>
                        </span>
                      </>
                    ) : (
                      <CloudImage
                        src={item.url}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        data-hover-image
                        className="object-cover"
                      />
                    )}
                  </div>
                </MaskImage>
                <span className="block p-4">
                  <span className="block font-semibold">{item.title}</span>
                  <span className="mt-1 block text-sm text-ink-muted">
                    {item.category.name} · {item.year}
                  </span>
                </span>
              </button>
            </HoverCard>
          </Reveal>
        ))}
      </RevealGroup>
      <dialog
        ref={dialogRef}
        aria-label="Gallery viewer"
        onCancel={(event) => {
          event.preventDefault();
          closeViewer();
        }}
        onKeyDown={handleKeyDown}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeViewer();
        }}
        className="m-auto max-h-[92vh] w-[min(96vw,72rem)] max-w-none rounded-panel border border-line bg-charcoal p-0 text-white shadow-raised backdrop:bg-charcoal/80"
      >
        {active ? (
          <div className="flex max-h-[92vh] flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-white/15 p-3 sm:px-5">
              <div className="min-w-0">
                <p className="truncate font-semibold">{active.title}</p>
                <p className="text-sm text-white/65">
                  {active.category.name} · {active.year}
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-control text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
                onClick={closeViewer}
                aria-label="Close gallery viewer"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div
              className="relative flex min-h-0 flex-1 items-center justify-center p-3 sm:p-5"
              onTouchStart={(event) => {
                touchStartRef.current = event.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(event) => {
                const x = event.changedTouches[0]?.clientX;
                if (x !== undefined) touchEnd(x);
              }}
            >
              {active.mediaType === "VIDEO" ? (
                <video
                  key={active.id}
                  src={active.url}
                  poster={cloudinaryVideoPoster(active.url)}
                  controls
                  playsInline
                  preload="none"
                  className="max-h-[72vh] max-w-full rounded-control"
                  aria-label={active.title}
                />
              ) : (
                <div className="relative h-[70vh] w-full">
                  <CloudImage
                    src={active.url}
                    alt={active.title}
                    fill
                    sizes="96vw"
                    className="object-contain"
                  />
                </div>
              )}
              {items.length > 1 ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute left-3 top-1/2 size-11 -translate-y-1/2 rounded-full bg-charcoal/80 text-white"
                    onClick={() => step(-1)}
                    aria-label="Previous gallery item"
                  >
                    <ChevronLeft aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute right-3 top-1/2 size-11 -translate-y-1/2 rounded-full bg-charcoal/80 text-white"
                    onClick={() => step(1)}
                    aria-label="Next gallery item"
                  >
                    <ChevronRight aria-hidden="true" />
                  </Button>
                </>
              ) : null}
            </div>
            <p className="border-t border-white/15 px-5 py-3 text-sm text-white/70">
              {active.caption || `${active.title} · ${active.category.name} · ${active.year}`}
            </p>
            <p
              className="border-t border-white/15 px-5 py-3 text-sm text-white/70"
              aria-live="polite"
            >
              {(activeIndex ?? 0) + 1} of {items.length}
            </p>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
