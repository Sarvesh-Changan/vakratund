"use client";

import { useEffect } from "react";

import { trackAnalyticsEvent } from "./analytics-events";

export function AnalyticsConversion({ events, reference }: { events: readonly ("generate_lead" | "estimate_completed")[]; reference?: string }): null {
  useEffect(() => {
    for (const event of events) trackAnalyticsEvent(event, reference ? { estimate_reference: reference } : {});
  }, [events, reference]);

  return null;
}
