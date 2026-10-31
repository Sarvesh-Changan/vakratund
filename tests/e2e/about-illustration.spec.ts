import { expect, test } from "@playwright/test";

test("About story artwork keeps its frame size at desktop and mobile widths", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop" && testInfo.project.name !== "mobile", "About responsive coverage");
  const desktop = testInfo.project.name === "desktop";
  const viewport = desktop ? { width: 1280, height: 900 } : { width: 390, height: 844 };
  await page.setViewportSize(viewport);
  await page.goto("/about");

  const frame = page.locator("[data-about-story-frame]");
  await expect(frame).toBeVisible();
  const firstSize = await frame.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  expect(firstSize.width / firstSize.height).toBeCloseTo(desktop ? 4 / 3 : 16 / 10, 1);

  if (await frame.locator("img").count() === 0) {
    await expect(frame.getByRole("img", { name: "Illustration of a building under construction with a crane" })).toBeVisible();
  } else {
    await expect(frame.locator("img")).toBeVisible();
  }
  await page.waitForTimeout(250);
  const finalSize = await frame.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  expect(finalSize).toEqual(firstSize);
});
