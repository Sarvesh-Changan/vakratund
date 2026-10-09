"use client";

import { useEffect } from "react";
import { captureFirstPartyAttribution } from "./attribution";
import { trackAnalyticsEvent } from "./analytics-events";
import { trackContactClick, type ContactClickType } from "./contact-tracking";

export function AttributionCapture() {
  useEffect(() => {
    captureFirstPartyAttribution();
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-contact-type]") : null;
      const type = target?.dataset.contactType as ContactClickType | undefined;
      const context = target?.dataset.contactContext;
      if (!type || !context) return;
      trackContactClick(type, context);
      trackAnalyticsEvent(type === "CALL" ? "click_call" : "click_whatsapp", { context });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
