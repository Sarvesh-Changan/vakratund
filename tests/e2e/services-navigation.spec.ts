import { expect, test } from "@playwright/test";

test("desktop Services menu shows every published title and navigates to its service", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop navigation coverage");
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");

  await page.getByRole("link", { name: "Services", exact: true }).hover();
  const panel = page.getByRole("region", { name: "Services" });
  await expect(panel).toBeVisible();

  const items = panel.locator("[data-service-menu-item]");
  const count = await items.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    const item = items.nth(index);
    await expect(item).toBeVisible();
    const bounds = await item.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(768);
  }
  const list = panel.locator("ul");
  const listMetrics = await list.evaluate((element) => ({ scrollHeight: element.scrollHeight, clientHeight: element.clientHeight }));
  expect(listMetrics.scrollHeight).toBeLessThanOrEqual(listMetrics.clientHeight + 1);

  const href = await items.first().getAttribute("href");
  expect(href).toMatch(/^\/services\/[a-z0-9-]+$/);
  await items.first().click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
});

test("mobile Services accordion opens and navigates to a service", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile navigation coverage");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();

  const trigger = page.getByRole("button", { name: "Toggle Services" });
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const accordion = page.locator("#mobile-services-accordion");
  const items = accordion.locator("[data-service-menu-item]");
  await expect(items.first()).toBeVisible();
  await expect(accordion.getByRole("link", { name: "View all services" })).toBeVisible();

  const href = await items.first().getAttribute("href");
  expect(href).toMatch(/^\/services\/[a-z0-9-]+$/);
  await items.first().click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();

  await page.goto("/");
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("button", { name: "Toggle Services" })).toBeVisible();
});
