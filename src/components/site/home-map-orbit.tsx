"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { useMotionPreference } from "@/components/motion";

interface LocationMarker {
  id: string;
  name: string;
  top: string;
  left: string;
}

const LOCATIONS: LocationMarker[] = [
  {
    id: "thane",
    name: "Thane",
    top: "27%",
    left: "14%",
  },
  {
    id: "mumbai",
    name: "Mumbai",
    top: "40%",
    left: "7%",
  },
  {
    id: "pune",
    name: "Pune",
    top: "67%",
    left: "32%",
  },
];

export function HomeMapOrbit() {
  const { reducedMotion } = useMotionPreference();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-[38rem] select-none">
      {/* 1. Actual Maharashtra Map Background (Preserves exact geographical boundary and proportions) */}
      <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4">
        <Image
          src="/maha-map.jpg"
          alt="Maharashtra geographical service map"
          fill
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="pointer-events-none object-contain opacity-85"
          priority
        />
      </div>

      {/* 2. Floating white location pills with purple pins and hover pop-up */}
      {LOCATIONS.map((loc) => {
        const isHovered = hovered === loc.id;
        return (
          <div
            key={loc.id}
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-transform duration-200"
            style={{ top: loc.top, left: loc.left }}
          >
            <div
              onMouseEnter={() => setHovered(loc.id)}
              onMouseLeave={() => setHovered(null)}
              className={`flex items-center gap-1.5 rounded-full border bg-white/95 px-3 py-1 text-xs font-semibold text-ink shadow-md backdrop-blur-sm transition-all duration-200 sm:px-3.5 sm:py-1.5 sm:text-sm cursor-default ${
                isHovered
                  ? "-translate-y-1 scale-110 border-purple-400 ring-2 ring-purple-400/25 shadow-raised"
                  : "border-line/70 hover:border-purple-300"
              }`}
            >
              <MapPin size={14} className="text-purple-600 shrink-0" aria-hidden="true" />
              <span>{loc.name}</span>
            </div>
          </div>
        );
      })}

      {/* 3. Dark Navy Rotating 3D Sphere in front of map */}
      <div
        className="absolute left-[36%] top-[42%] z-10 -translate-x-1/2 -translate-y-1/2"
        aria-label="Vakratund Construction 3D rotating globe"
      >
        <div className="sphere-3d relative flex size-36 sm:size-44 md:size-48 items-center justify-center rounded-full overflow-hidden">
          {/* Subtle Rotating Longitude/Latitude Wireframe */}
          <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
            {/* Latitude Parallels (Static 3D perspective curves) */}
            <svg
              viewBox="0 0 200 200"
              className="absolute inset-0 size-full stroke-white/20"
              fill="none"
              strokeWidth="1"
              aria-hidden="true"
            >
              <ellipse cx="100" cy="55" rx="76" ry="16" />
              <ellipse cx="100" cy="100" rx="98" ry="24" stroke="rgba(255,255,255,0.25)" />
              <ellipse cx="100" cy="145" rx="76" ry="16" />
            </svg>

            {/* Longitude Meridians (Smooth Continuous 360-degree rotation) */}
            <div
              className={`absolute inset-0 flex w-[200%] ${
                reducedMotion ? "" : "sphere-spin-track"
              }`}
              style={{ willChange: "transform" }}
              aria-hidden="true"
            >
              {/* Primary Meridian Set */}
              <svg
                viewBox="0 0 200 200"
                className="size-full shrink-0 stroke-white/20"
                fill="none"
                strokeWidth="1"
              >
                <ellipse cx="100" cy="100" rx="88" ry="98" />
                <ellipse cx="100" cy="100" rx="60" ry="98" />
                <ellipse cx="100" cy="100" rx="30" ry="98" />
                <line x1="100" y1="2" x2="100" y2="198" stroke="rgba(255,255,255,0.28)" />
                <ellipse cx="100" cy="100" rx="10" ry="98" />
              </svg>
              {/* Duplicate Meridian Set for seamless loop */}
              <svg
                viewBox="0 0 200 200"
                className="size-full shrink-0 stroke-white/20"
                fill="none"
                strokeWidth="1"
              >
                <ellipse cx="100" cy="100" rx="88" ry="98" />
                <ellipse cx="100" cy="100" rx="60" ry="98" />
                <ellipse cx="100" cy="100" rx="30" ry="98" />
                <line x1="100" y1="2" x2="100" y2="198" stroke="rgba(255,255,255,0.28)" />
                <ellipse cx="100" cy="100" rx="10" ry="98" />
              </svg>
            </div>

            {/* Specular 3D Lighting Highlight */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.08) 35%, transparent 65%)",
              }}
            />
          </div>

          {/* VAKRATUND CONSTRUCTION Central Branding */}
          <div className="relative z-10 flex flex-col items-center justify-center px-2 text-center pointer-events-none">
            <span className="font-bold text-[10px] sm:text-[12px] md:text-[13px] tracking-[0.2em] text-white leading-tight uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
              VAKRATUND
            </span>
            <span className="font-bold text-[8px] sm:text-[10px] md:text-[11px] tracking-[0.22em] text-white/90 leading-tight uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] mt-0.5">
              CONSTRUCTION
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
