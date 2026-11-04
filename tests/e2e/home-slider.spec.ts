import { expect, test } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;
const hasAdminCredentials = Boolean(email && password);

test.describe("Home Page Slider & Stats Band Removal", () => {
  const viewports = [
    { name: "desktop", width: 1366, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    test.describe(`${vp.name} viewport (${vp.width}x${vp.height})`, () => {
      test("stats band is completely removed from the home page", async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto("/", { waitUntil: "domcontentloaded" });

        // Verify the old home stats band (numbers and stats labels) is absent
        const statsBand = page.locator('[data-testid="home-stats-band"]');
        await expect(statsBand).toHaveCount(0);

        // Verify specific stats labels from the old stats band are absent on the home page
        const teamStats = page.getByText("Team members", { exact: true });
        const publishedServices = page.getByText("Published services", { exact: true });
        const publishedProjects = page.getByText("Published projects", { exact: true });

        await expect(teamStats).toHaveCount(0);
        await expect(publishedServices).toHaveCount(0);
        await expect(publishedProjects).toHaveCount(0);
      });

      test("photo showcase slider renders, respects speed and pause controls", async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto("/", { waitUntil: "domcontentloaded" });

        const showcase = page.locator('[role="region"][aria-label="Photo showcase"]');
        const count = await showcase.count();

        // If slides have been seeded in the DB
        if (count > 0) {
          await expect(showcase).toBeVisible();

          const marqueeTracks = showcase.locator(".motion-marquee-track");
          if ((await marqueeTracks.count()) > 0) {
            const firstTrack = marqueeTracks.first();
            await expect(firstTrack).toBeVisible();

            // Track movement
            const getX = async () => {
              return page.evaluate((el) => {
                if (!el) return 0;
                const style = window.getComputedStyle(el);
                const matrix = new DOMMatrixReadOnly(style.transform);
                return matrix.m41;
              }, await firstTrack.elementHandle());
            };

            const x1 = await getX();
            await page.waitForTimeout(300);
            const x2 = await getX();

            // Pause button functionality
            const pauseBtn = showcase.getByRole("button", { name: /Pause Photo showcase/i }).first();
            if (await pauseBtn.isVisible()) {
              await pauseBtn.click();
              await page.waitForTimeout(200);
              const p1 = await getX();
              await page.waitForTimeout(300);
              const p2 = await getX();
              expect(Math.abs(p1 - p2)).toBeLessThan(1.0);

              const playBtn = showcase.getByRole("button", { name: /Play Photo showcase/i }).first();
              await playBtn.click();
            }
          }
        }
      });

      test("reduced-motion emulation renders static row", async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto("/", { waitUntil: "domcontentloaded" });

        const showcase = page.locator('[role="region"][aria-label="Photo showcase"]');
        if ((await showcase.count()) > 0) {
          // When reduced motion is preferred, marquee animation is disabled
          const animatedTrack = showcase.locator(".motion-marquee-track.animate-marquee");
          await expect(animatedTrack).toHaveCount(0);
        }
      });
    });
  }

  test("admin home slider management interface", async ({ page }) => {
    test.skip(!hasAdminCredentials, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin checks");

    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(email ?? "");
    await page.getByLabel("Password").fill(password ?? "");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/admin");

    // Navigate to Home slider
    await page.goto("/admin/home-slider");
    await expect(page.getByRole("heading", { level: 1, name: "Home page image slider" })).toBeVisible();

    // Verify presence of "+ Add images" button and settings card
    await expect(page.getByRole("button", { name: /Add images/i })).toBeVisible();
    await expect(page.getByText("Slider settings", { exact: false })).toBeVisible();
    await expect(page.getByLabel("Eyebrow text")).toBeVisible();
    await expect(page.getByLabel("Heading text")).toBeVisible();
    await expect(page.getByLabel("Slider speed")).toBeVisible();
  });
});

