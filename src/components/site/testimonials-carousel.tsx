"use client";

import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useState } from "react";
import type { PublishedTestimonial } from "@/server/queries/testimonials";

export function TestimonialsCarousel({ testimonials }: { testimonials: PublishedTestimonial[] }) {
  const [index, setIndex] = useState(0);
  if (testimonials.length === 0) return null;
  const current = testimonials[index];
  if (!current) return null;
  const previous = () => setIndex((value) => (value - 1 + testimonials.length) % testimonials.length);
  const next = () => setIndex((value) => (value + 1) % testimonials.length);
  return <div className="mt-10" role="region" aria-roledescription="carousel" aria-label="Client testimonials" tabIndex={0} onKeyDown={(event) => { if (event.key === "ArrowLeft") previous(); if (event.key === "ArrowRight") next(); }}><div className="rounded-panel border bg-surface p-7 shadow-soft sm:p-10"><Quote className="text-brand" size={30} aria-hidden="true" /><blockquote className="mt-5 max-w-3xl font-heading text-2xl font-semibold leading-tight">“{current.quote}”</blockquote><div className="mt-7"><p className="font-semibold">{current.name}</p>{current.roleOrOrg ? <p className="text-sm text-ink-muted">{current.roleOrOrg}</p> : null}</div></div><div className="mt-5 flex items-center justify-between"><p className="text-sm text-ink-muted" aria-live="polite">{index + 1} of {testimonials.length}</p><div className="flex gap-2"><button type="button" onClick={previous} aria-label="Previous testimonial" className="inline-flex size-11 items-center justify-center rounded-full border border-line hover:bg-surface-alt"><ChevronLeft size={18} aria-hidden="true" /></button><button type="button" onClick={next} aria-label="Next testimonial" className="inline-flex size-11 items-center justify-center rounded-full border border-line hover:bg-surface-alt"><ChevronRight size={18} aria-hidden="true" /></button></div></div></div>;
}
