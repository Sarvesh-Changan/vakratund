"use client";

export type ContactClickType = "CALL" | "WHATSAPP";

export function trackContactClick(type: ContactClickType, context: string): void {
  const payload = JSON.stringify({
    type,
    pagePath: window.location.pathname,
    context,
  });

  if (navigator.sendBeacon) {
    const body = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon("/api/events", body);
    return;
  }

  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}
