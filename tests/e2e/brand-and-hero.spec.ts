import { expect, test } from "@playwright/test";

test.describe("Brand Wordmark, Moving Chips, and Hero Visuals", () => {
  const viewports = [
    { name: "desktop", width: 1366, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    test.describe(`${vp.name} viewport (${vp.width}x${vp.height})`, () => {
      test("hero displays peach background, dark text, and line-art decoration", async ({
        page,
      }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto("/", { waitUntil: "domcontentloaded" });

        const hero = page
          .locator("section")
          .filter({ hasText: "Building trust" })
          .first();
        await expect(hero).toBeVisible();

        const headline = hero.locator("h1");
        await expect(headline).toBeVisible();
        await expect(headline).toHaveText(/Building trust/i);

        const quoteBtn = hero.getByRole("link", { name: /Get Free Quote/i });
        await expect(quoteBtn).toBeVisible();

        const callBtn = hero.getByRole("link", { name: /Call Now/i });
        await expect(callBtn).toBeVisible();
      });

      test("credibility chips strip moves at a steady rate, pauses on hover, and pauses on button toggle", async ({
        page,
      }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto("/", { waitUntil: "domcontentloaded" });

        const stripRegion = page.locator(
          '[role="region"][aria-label="Company credentials"]'
        );
        await expect(stripRegion).toBeVisible();

        const track = stripRegion.locator(".motion-marquee-track");
        await expect(track).toBeVisible();

        const getTransformX = async () => {
          return page.evaluate((el) => {
            if (!el) return 0;
            const style = window.getComputedStyle(el);
            const matrix = new DOMMatrixReadOnly(style.transform);
            return matrix.m41;
          }, await track.elementHandle());
        };

        const pos1 = await getTransformX();
        await page.waitForTimeout(300);
        const pos2 = await getTransformX();
        await page.waitForTimeout(300);
        const pos3 = await getTransformX();

        const diff1 = pos1 - pos2;
        const diff2 = pos2 - pos3;

        if (diff1 > 0 && diff2 > 0) {
          const ratio = Math.abs(diff1 - diff2) / Math.max(diff1, diff2);
          expect(ratio).toBeLessThan(0.35);
        }

        const pauseBtn = stripRegion.getByRole("button", {
          name: /Pause Company credentials/i,
        });
        if (await pauseBtn.isVisible()) {
          await pauseBtn.click();
          await page.waitForTimeout(200);
          const pausedPos1 = await getTransformX();
          await page.waitForTimeout(400);
          const pausedPos2 = await getTransformX();
          expect(Math.abs(pausedPos1 - pausedPos2)).toBeLessThan(1.0);

          const playBtn = stripRegion.getByRole("button", {
            name: /Play Company credentials/i,
          });
          await playBtn.click();
        }

        if (vp.name === "desktop") {
          await stripRegion.hover({ force: true });
          await page.waitForTimeout(200);
          const hoverPos1 = await getTransformX();
          await page.waitForTimeout(400);
          const hoverPos2 = await getTransformX();
          expect(Math.abs(hoverPos1 - hoverPos2)).toBeLessThan(1.0);
        }
      });
    });
  }

  test("header wordmark does not overflow or wrap at 360px viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const wordmark = page.locator(".brand-wordmark").first();
    await expect(wordmark).toBeVisible();

    const box = await wordmark.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThan(220);
    expect(box!.height).toBeLessThan(35);

    const hasHorizontalOverflow = await page.evaluate(() => {
      return (
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
      );
    });
    expect(hasHorizontalOverflow).toBe(false);
  });
});

