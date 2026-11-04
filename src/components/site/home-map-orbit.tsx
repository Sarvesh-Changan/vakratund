"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { useMotionPreference } from "@/components/motion";

interface Location {
  id: string;
  name: string;
  top: string;
  left: string;
  details: string;
}

const LOCATIONS: Location[] = [
  { id: "thane", name: "Thane", top: "28%", left: "18%", details: "PMC & turnkey redevelopment projects" },
  { id: "mumbai", name: "Mumbai", top: "38%", left: "12%", details: "Commercial construction & structural audit" },
  { id: "kalyan", name: "Kalyan", top: "25%", left: "28%", details: "Residential societies & waterproofing works" },
  { id: "maharashtra", name: "Maharashtra", top: "50%", left: "62%", details: "State-wide rehabilitation & civil engineering" },
];

/**
 * Clean vector outline of Maharashtra matching the actual geographic state shape.
 */
function MaharashtraMapVector() {
  return (
    <svg
      className="absolute inset-0 size-full text-ink opacity-[0.22]"
      viewBox="0 0 600 500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Geographically realistic trace of Maharashtra state boundary */}
      <path d="M 82,145 L 88,172 L 80,205 L 75,248 L 78,285 L 85,320 L 98,375 L 115,415 L 128,405 L 140,368 L 148,332 L 158,302 L 175,295 L 198,310 L 225,328 L 248,348 L 272,335 L 298,315 L 315,328 L 338,318 L 358,295 L 382,282 L 415,285 L 438,268 L 472,275 L 512,258 L 535,225 L 548,185 L 532,152 L 505,145 L 482,158 L 452,148 L 432,122 L 405,115 L 382,128 L 355,122 L 328,105 L 295,98 L 265,112 L 238,102 L 212,118 L 185,112 L 158,128 L 128,122 L 105,138 Z" />
      {/* Internal region divider accents (Konkan coast line & Desh plateau line) */}
      <path d="M 88,172 L 112,185 L 128,218 L 138,262 L 148,332" strokeDasharray="3 3" opacity="0.6" />
      <path d="M 238,102 L 245,152 L 235,208 L 225,328" strokeDasharray="3 3" opacity="0.6" />
      <path d="M 355,122 L 362,178 L 358,295" strokeDasharray="3 3" opacity="0.6" />
    </svg>
  );
}

export function HomeMapOrbit() {
  const { reducedMotion } = useMotionPreference();
  const [hovered, setHovered] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);

  const isActive = (id: string) => active === id || hovered === id;

  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-[38rem]">
      {/* Background vector elements */}
      <div className="absolute inset-0">
        {/* Maharashtra State Map Outline */}
        <MaharashtraMapVector />

        {/* Animated orbital rings */}
        {!reducedMotion && (
          <svg
            className="absolute inset-0 size-full text-line/40"
            viewBox="0 0 500 500"
            fill="none"
            aria-hidden="true"
          >
            <ellipse
              cx="250"
              cy="250"
              rx="190"
              ry="104"
              stroke="currentColor"
              strokeWidth="1"
              className="home-orbit-ring-1"
            />
            <ellipse
              cx="250"
              cy="250"
              rx="190"
              ry="104"
              stroke="currentColor"
              strokeWidth="1"
              transform="rotate(62 250 250)"
              className="home-orbit-ring-2"
            />
          </svg>
        )}
      </div>

      {/* Center rotating company badge */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {!reducedMotion && (
            <div className="absolute inset-0 rounded-full border border-dark/15 home-orbit-pulse" />
          )}
          <div className="relative flex size-32 items-center justify-center rounded-full bg-dark text-white shadow-raised">
            <span className="px-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] leading-tight">
              Vakratund<br />Construction
            </span>
          </div>
        </div>
      </div>

      {/* Interactive location badges */}
      {LOCATIONS.map((loc) => (
        <div key={loc.id} className="absolute" style={{ top: loc.top, left: loc.left }}>
          <button
            type="button"
            onMouseEnter={() => setHovered(loc.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setActive(active === loc.id ? null : loc.id)}
            className={`group relative rounded-full border bg-bg px-4 py-2 text-sm font-semibold text-ink shadow-soft transition-all ${
              isActive(loc.id)
                ? "border-dark/40 scale-105 bg-white"
                : "border-line hover:border-dark/20 hover:scale-[1.03]"
            }`}
            aria-expanded={isActive(loc.id)}
            aria-controls={`home-map-pop-${loc.id}`}
          >
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-accent" aria-hidden="true" />
              {loc.name}
            </span>
          </button>

          {isActive(loc.id) && (
            <div
              id={`home-map-pop-${loc.id}`}
              className="pointer-events-none absolute left-1/2 top-full z-20 mt-3 w-56 -translate-x-1/2"
            >
              <div className="rounded-xl border border-line bg-bg p-4 shadow-raised">
                <h4 className="flex items-center gap-2 font-semibold text-ink">
                  <MapPin size={16} className="text-accent" aria-hidden="true" />
                  {loc.name}
                </h4>
                <p className="mt-1.5 text-sm leading-6 text-ink-muted">{loc.details}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
