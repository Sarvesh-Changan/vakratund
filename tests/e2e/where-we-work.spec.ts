import { expect, test } from "@playwright/test";

test.describe("Where We Work Section & Maharashtra Map", () => {
  const viewports = [
    { name: "desktop", width: 1366, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    test.describe(`${vp.name} viewport (${vp.width}x${vp.height})`, () => {
      test("renders Maharashtra map, accurate city markers, 3D sphere and contact CTA", async ({
        page,
      }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto("/", { waitUntil: "domcontentloaded" });

        // Section exists
        const section = page.locator("section").filter({ hasText: "WHERE WE WORK" }).first();
        await expect(section).toBeVisible();

        // Right-side copy
        await expect(section.getByText("WHERE WE WORK")).toBeVisible();
        await expect(
          section.getByRole("heading", { name: /Thane and Mumbai/i })
        ).toBeVisible();
        await expect(section.getByText("Quality is our first priority")).toBeVisible();
        const contactBtn = section.getByRole("link", { name: /Contact us/i });
        await expect(contactBtn).toBeVisible();
        await expect(contactBtn).toHaveAttribute("href", "/contact");

        // Maharashtra Map Image
        const mapImg = section.locator('img[src="/maha-map.jpg"]');
        await expect(mapImg).toBeVisible();

        // Accurate markers: Mumbai, Thane, Pune
        const mumbaiMarker = section.getByText("Mumbai", { exact: true });
        const thaneMarker = section.getByText("Thane", { exact: true });
        const puneMarker = section.getByText("Pune", { exact: true });

        await expect(mumbaiMarker).toBeVisible();
        await expect(thaneMarker).toBeVisible();
        await expect(puneMarker).toBeVisible();

        // Check relative positions on desktop: Mumbai and Thane are geographically close, Pune is southeast
        if (vp.name === "desktop") {
          const mumbaiBox = await mumbaiMarker.boundingBox();
          const thaneBox = await thaneMarker.boundingBox();
          const puneBox = await puneMarker.boundingBox();

          if (mumbaiBox && thaneBox && puneBox) {
            // Thane is northeast of Mumbai or very close horizontally
            const distMumbaiThane = Math.hypot(
              mumbaiBox.x - thaneBox.x,
              mumbaiBox.y - thaneBox.y
            );
            // Pune is to the right (east) and below (south) of Mumbai
            expect(puneBox.x).toBeGreaterThan(mumbaiBox.x);
            expect(puneBox.y).toBeGreaterThan(thaneBox.y);
            // Distance between Mumbai and Thane should be relatively small
            expect(distMumbaiThane).toBeLessThan(150);
          }
        }

        // 3D Navy Sphere
        const sphere = section.locator(".sphere-3d");
        await expect(sphere).toBeVisible();
        await expect(sphere.getByText("VAKRATUND")).toBeVisible();
        await expect(sphere.getByText("CONSTRUCTION")).toBeVisible();
      });

      test("reduced-motion emulation halts sphere rotation", async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto("/", { waitUntil: "domcontentloaded" });

        const section = page.locator("section").filter({ hasText: "WHERE WE WORK" }).first();
        const rotatingTrack = section.locator(".sphere-spin-track");
        await expect(rotatingTrack).toHaveCount(0);
      });
    });
  }
});

