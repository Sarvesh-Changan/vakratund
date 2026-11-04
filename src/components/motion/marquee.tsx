"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { Pause, Play } from "lucide-react";
import { useMotionPreference } from "./motion-preference";
import { cn } from "@/lib/utils";

export interface MarqueeProps {
  children: ReactNode;
  label: string;
  speed?: number; // pixels per second (default: 40)
  direction?: "left" | "right";
  gap?: number; // in pixels (default: 24)
  pauseOnHover?: boolean; // default: true
  showPauseButton?: boolean; // default: true
  className?: string;
  fixedHeightClass?: string; // default: "min-h-[3.5rem]"
}

export function Marquee({
  children,
  label,
  speed = 40,
  direction = "left",
  gap = 24,
  pauseOnHover = true,
  showPauseButton = true,
  className,
  fixedHeightClass = "min-h-[3.5rem]",
}: MarqueeProps) {
  const { ready, reducedMotion } = useMotionPreference();
  const [duration, setDuration] = useState<number>(30);
  const [animationDelay, setAnimationDelay] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isTabHidden, setIsTabHidden] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const primarySetRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);
  const currentDurationRef = useRef<number>(30);
  const measuredWidthRef = useRef<number>(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    currentDurationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabHidden(document.visibilityState === "hidden");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const el = primarySetRef.current;
    if (!el) return;

    const measure = () => {
      const measuredWidth =
        el.scrollWidth || el.offsetWidth || el.getBoundingClientRect().width;
      if (measuredWidth <= 0) return;

      const prevWidth = measuredWidthRef.current;
      if (Math.abs(prevWidth - measuredWidth) < 1) return;
      measuredWidthRef.current = measuredWidth;

      const effectiveSpeed = Math.max(5, speed);
      const newDuration = Math.max(1, measuredWidth / effectiveSpeed);

      const now = Date.now();
      if (startTimeRef.current === 0) {
        startTimeRef.current = now;
      }
      const elapsed = (now - startTimeRef.current) / 1000;
      const oldDuration = currentDurationRef.current;
      const currentProgress =
        oldDuration > 0 ? (elapsed % oldDuration) / oldDuration : 0;

      const newElapsed = currentProgress * newDuration;
      startTimeRef.current = now - newElapsed * 1000;

      setAnimationDelay(-newElapsed);
      setDuration(newDuration);
    };

    measure();

    const observer = new ResizeObserver(() => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(measure, 100);
    });
    observer.observe(el);

    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(measure).catch(() => {});
    }

    return () => {
      observer.disconnect();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [speed]);

  const motionActive = ready && !reducedMotion;

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={label}
      data-marquee-paused={isPaused}
      data-motion-active={motionActive}
      className={cn(
        "motion-marquee relative flex items-center overflow-hidden",
        fixedHeightClass,
        className
      )}
    >
      {/* Soft edge fade masks */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-bg to-transparent sm:w-16"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-bg to-transparent sm:w-16"
        aria-hidden="true"
      />

      {/* WCAG 2.2.2 Pause/Play Button */}
      {showPauseButton && motionActive ? (
        <button
          type="button"
          onClick={() => setIsPaused((prev) => !prev)}
          aria-label={isPaused ? `Play ${label}` : `Pause ${label}`}
          aria-pressed={isPaused}
          className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-line bg-bg/95 p-1.5 text-ink-muted shadow-soft transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          {isPaused ? (
            <Play size={13} aria-hidden="true" />
          ) : (
            <Pause size={13} aria-hidden="true" />
          )}
        </button>
      ) : null}

      {/* Marquee Track */}
      <div
        className={cn(
          "motion-marquee-track flex shrink-0 items-center",
          pauseOnHover && "motion-marquee-hover-pause",
          !motionActive &&
            "motion-marquee-static w-full flex-wrap justify-center overflow-x-auto"
        )}
        style={
          motionActive
            ? ({
                "--marquee-duration": `${duration}s`,
                "--marquee-delay": `${animationDelay}s`,
                "--marquee-direction":
                  direction === "right" ? "reverse" : "normal",
                "--marquee-play-state":
                  isPaused || isTabHidden ? "paused" : "running",
              } as CSSProperties)
            : undefined
        }
      >
        {/* Set 1: Accessible Primary Content */}
        <div
          ref={primarySetRef}
          className="motion-marquee-set flex shrink-0 items-center"
          style={{ paddingRight: `${gap}px` }}
        >
          {children}
        </div>

        {/* Set 2: Seamless duplicate, aria-hidden and inert */}
        {motionActive ? (
          <div
            aria-hidden="true"
            inert
            className="motion-marquee-set flex shrink-0 items-center"
            style={{ paddingRight: `${gap}px` }}
          >
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
