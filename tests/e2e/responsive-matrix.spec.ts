import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const viewportMatrix = [
  { width: 320, height: 800 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 900 },
  { width: 768, height: 900 },
  { width: 1024, height: 900 },
  { width: 1280, height: 900 },
  { width: 1536, height: 960 },
  { width: 844, height: 390 },
] as const;

const publicRoutes = [
  "/", "/about", "/services", "/services/building-construction", "/projects",
  "/projects/residential-commercial-building-kharkar-ali", "/gallery", "/testimonials",
  "/contact", "/estimate", "/faqs", "/privacy",
] as const;

async function expectNoHorizontalOverflow(page: Page, route: string, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.goto(route, { waitUntil: "domcontentloaded" });
  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(widths.document, `${route} at ${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(widths.viewport);
  expect(widths.body, `${route} body at ${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(widths.viewport);
  const unclipped = await page.evaluate(() => {
    const wrapper = document.querySelector<HTMLElement>("[data-public-site]");
    if (!wrapper) return document.documentElement.scrollWidth;
    const previous = wrapper.style.overflowX;
    wrapper.style.overflowX = "visible";
    const width = document.documentElement.scrollWidth;
    wrapper.style.overflowX = previous;
    return width;
  });
  expect(unclipped, `${route} source overflow at ${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(widths.viewport);
}

test.describe("responsive viewport matrix", () => {
  test.setTimeout(240_000);

  for (const route of publicRoutes) {
    test(`${route} has no page-level horizontal overflow`, async ({ page }) => {
      for (const viewport of viewportMatrix) await expectNoHorizontalOverflow(page, route, viewport);
    });
  }

  test("mobile drawer fits, scrolls internally, traps focus, and passes axe", async ({ page }) => {
    mkdirSync("docs/visual-qa/mobile", { recursive: true });
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");
    const menuButton = page.locator('button[aria-controls="mobile-navigation"]');
    await expect(menuButton).toHaveAttribute("aria-label", "Open menu");
    await expect(menuButton).toHaveCSS("width", "44px");
    await menuButton.click();
    const drawer = page.getByRole("dialog", { name: "Main menu" });
    await expect(drawer).toBeVisible();
    await expect(menuButton).toHaveAttribute("aria-expanded", "true");
    const drawerBox = await drawer.boundingBox();
    expect(drawerBox?.height).toBe(800);
    await expect(page.locator("[data-mobile-contact-bar]")).toBeHidden();
    await expect(page.locator("[data-floating-contact]")).toBeHidden();

    await drawer.getByRole("button", { name: "Toggle Services" }).click();
    const scrollArea = drawer.locator(".site-drawer-links");
    const links = drawer.locator(".site-drawer-links a[href], .site-drawer-links button");
    const count = await links.count();
    let previousScrollTop = -1;
    for (let index = 0; index < count; index += 1) {
      const link = links.nth(index);
      await link.scrollIntoViewIfNeeded();
      const bounds = await link.boundingBox();
      const listBounds = await scrollArea.boundingBox();
      expect(bounds).not.toBeNull();
      expect(listBounds).not.toBeNull();
      expect(bounds!.y).toBeGreaterThanOrEqual(listBounds!.y - 1);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(listBounds!.y + listBounds!.height + 1);
      const scrollTop = await scrollArea.evaluate((element) => element.scrollTop);
      if (index > 0) previousScrollTop = Math.max(previousScrollTop, scrollTop);
    }
    expect(previousScrollTop).toBeGreaterThan(0);

    const violations = (await new AxeBuilder({ page }).include("#mobile-navigation").analyze()).violations
      .filter((violation) => violation.impact === "critical" || violation.impact === "serious");
    expect(violations.map(({ id, description }) => ({ id, description }))).toEqual([]);
    await page.screenshot({ path: "docs/visual-qa/mobile/open-drawer.png" });

    const first = drawer.locator("a[href]").first();
    await first.focus();
    await page.keyboard.press("Shift+Tab");
    await expect(drawer.locator('a[href], button:not([disabled])').last()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await expect(menuButton).toBeFocused();
  });

  test("mobile quick contact switches at 768px and visual QA captures key pages", async ({ page }) => {
    mkdirSync("docs/visual-qa/mobile", { recursive: true });
    for (const width of [320, 360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/");
      await expect(page.locator("[data-mobile-contact-bar]")).toBeVisible();
      await expect(page.locator("[data-floating-contact]")).toBeHidden();
      const targets = page.locator("[data-mobile-contact-bar] a");
      for (let index = 0; index < await targets.count(); index += 1) {
        const box = await targets.nth(index).boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
    }
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto("/");
    await expect(page.locator("[data-mobile-contact-bar]")).toBeHidden();
    await expect(page.locator("[data-floating-contact]")).toBeVisible();

    const captures = [
      { path: "/", name: "hero" },
      { path: "/services", name: "card-grid" },
      { path: "/contact", name: "form" },
      { path: "/estimate", name: "estimator" },
    ];
    for (const capture of captures) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(capture.path, { waitUntil: "domcontentloaded" });
      await page.screenshot({ path: `docs/visual-qa/mobile/${capture.name}.png`, fullPage: capture.name !== "hero" });
    }
    await page.goto("/");
    await page.screenshot({ path: "docs/visual-qa/mobile/footer.png", fullPage: true });
  });

  test("admin routes fit the matrix when valid admin credentials are configured", async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL;
    const password = process.env.E2E_ADMIN_PASSWORD;
    test.skip(!email || !password, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD for authenticated admin responsive coverage.");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(email ?? "");
    await page.getByLabel("Password").fill(password ?? "");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/admin");
    const adminRoutes = ["/admin", "/admin/leads", "/admin/quotes", "/admin/projects", "/admin/gallery", "/admin/users", "/admin/activity"];
    for (const route of adminRoutes) {
      for (const viewport of viewportMatrix) await expectNoHorizontalOverflow(page, route, viewport);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin/leads");
    await page.screenshot({ path: "docs/visual-qa/mobile/admin-leads.png", fullPage: true });
  });
});
