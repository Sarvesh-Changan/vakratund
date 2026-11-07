"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface QuoteHeaderButtonProps {
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function QuoteHeaderButton({
  className,
  onClick,
  children = "Get Free Quote",
}: QuoteHeaderButtonProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const lastActivityRef = useRef<number>(0);

  useEffect(() => {
    // Reset activity timestamp on mount
    lastActivityRef.current = Date.now();

    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
      // If currently blinking, immediately cancel it upon user interaction
      setIsBlinking(false);
    };

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "wheel",
    ] as const;

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Check inactivity every 500ms
    const interval = setInterval(() => {
      if (document.hidden) return;

      const idleDuration = Date.now() - lastActivityRef.current;
      // Trigger after 10 seconds of inactivity and continue blinking until user does any activity
      if (idleDuration >= 10000) {
        setIsBlinking(true);
      }
    }, 500);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Radiating Yellow Energy Lines */}
      {isBlinking && (
        <div
          className="pointer-events-none absolute -inset-x-6 -inset-y-5 z-20 flex items-center justify-center overflow-visible"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 180 80"
            className="absolute size-full overflow-visible pointer-events-none animate-quote-rays"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: "drop-shadow(0 0 5px rgba(250, 204, 21, 0.95))" }}
          >
            {/* Top radiating yellow lines */}
            <line x1="55" y1="18" x2="48" y2="2" stroke="#FACC15" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="90" y1="16" x2="90" y2="0" stroke="#FACC15" strokeWidth="3" strokeLinecap="round" />
            <line x1="125" y1="18" x2="132" y2="2" stroke="#FACC15" strokeWidth="2.5" strokeLinecap="round" />

            {/* Bottom radiating yellow lines */}
            <line x1="55" y1="62" x2="48" y2="78" stroke="#FACC15" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="90" y1="64" x2="90" y2="80" stroke="#FACC15" strokeWidth="3" strokeLinecap="round" />
            <line x1="125" y1="62" x2="132" y2="78" stroke="#FACC15" strokeWidth="2.5" strokeLinecap="round" />

            {/* Left radiating yellow lines */}
            <line x1="22" y1="28" x2="4" y2="18" stroke="#FACC15" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="16" y1="40" x2="0" y2="40" stroke="#FACC15" strokeWidth="3" strokeLinecap="round" />
            <line x1="22" y1="52" x2="4" y2="62" stroke="#FACC15" strokeWidth="2.5" strokeLinecap="round" />

            {/* Right radiating yellow lines */}
            <line x1="158" y1="28" x2="176" y2="18" stroke="#FACC15" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="164" y1="40" x2="180" y2="40" stroke="#FACC15" strokeWidth="3" strokeLinecap="round" />
            <line x1="158" y1="52" x2="176" y2="62" stroke="#FACC15" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* Button with Yellow Blink Effect */}
      <Link
        href="/estimate"
        onClick={onClick}
        className={cn(
          "relative z-10 inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-control bg-accent px-4 text-sm font-bold text-accent-ink transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          isBlinking && "animate-quote-blink ring-2 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.8)]",
          className
        )}
      >
        {children}
      </Link>
    </div>
  );
}

