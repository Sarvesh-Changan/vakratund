import { writeFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

type VisualQaRecord = {
  route: string;
  viewport: number;
  status: number;
  documentWidth: number;
  bodyWidth: number;
  pageHeight: number;
  h1Count: number;
  horizontalOverflow: boolean;
  layoutShift: number;
};

const routes = [
  { name: "home", path: "/" },
  { name: "about", path: "/about" },
  { name: "services", path: "/services" },
  { name: "service-building-construction", path: "/services/building-construction" },
  { name: "projects", path: "/projects" },
  { name: "project-kharkar-ali", path: "/projects/residential-commercial-building-kharkar-ali" },
  { name: "gallery", path: "/gallery" },
  { name: "testimonials", path: "/testimonials" },
  { name: "contact", path: "/contact" },
  { name: "estimate", path: "/estimate" },
  { name: "faqs", path: "/faqs" },
  { name: "privacy", path: "/privacy" },
] as const;

const widths = [360, 390, 768, 1024, 1280, 1536] as const;

test.describe.configure({ mode: "parallel" });
test.setTimeout(120_000);

async function readLayoutShift(page: Page): Promise<number> {
  return page.evaluate(() => new Promise<number>((resolve) => {
    let total = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!layoutShift.hadRecentInput) total += layoutShift.value ?? 0;
      }
    });
    observer.observe({ type: "layout-shift", buffered: true });
    window.setTimeout(() => {
      observer.disconnect();
      resolve(total);
    }, 100);
  }));
}

for (const route of routes) test(`${route.name} captures every required viewport`, async ({ page }) => {
  const records: VisualQaRecord[] = [];

  for (const viewport of widths) {
    await page.setViewportSize({ width: viewport, height: 900 });
    const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(250);
    const layoutShift = await readLayoutShift(page);
    const record = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      pageHeight: document.documentElement.scrollHeight,
      h1Count: document.querySelectorAll("h1").length,
    }));
    const status = response?.status() ?? 500;

    records.push({
      route: route.path,
      viewport,
      status,
      ...record,
      horizontalOverflow: record.documentWidth > viewport + 1 || record.bodyWidth > viewport + 1,
      layoutShift,
    });

    expect(status, `${route.path} at ${viewport}px`).toBeLessThan(500);
    expect(record.documentWidth, `${route.path} overflows at ${viewport}px`).toBeLessThanOrEqual(viewport + 1);
    expect(record.bodyWidth, `${route.path} body overflows at ${viewport}px`).toBeLessThanOrEqual(viewport + 1);
    await page.screenshot({ path: `docs/visual-qa/${route.name}-${viewport}.png`, fullPage: true, scale: "css" });
  }

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.screenshot({ path: `docs/visual-qa/${route.name}-scroll-state.png`, fullPage: true, scale: "css" });
  writeFileSync(`docs/visual-qa/${route.name}-metrics.json`, JSON.stringify(records, null, 2));
});
