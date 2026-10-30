import { expect, test } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;
const imagePath = process.env.E2E_IMAGE_FILE;
const serviceId = process.env.E2E_SERVICE_ID;
const serviceSlug = process.env.E2E_SERVICE_SLUG;
const enabled = Boolean(email && password && imagePath && serviceId && serviceSlug);

test("admin uploads a scoped service cover and About story image", async ({ page }) => {
  test.skip(!enabled, "Set E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD, E2E_IMAGE_FILE, E2E_SERVICE_ID, and E2E_SERVICE_SLUG to run the Cloudinary-backed admin flow.");
  test.setTimeout(120_000);

  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email ?? "");
  await page.getByLabel("Password").fill(password ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/admin");

  await page.goto(`/admin/services/${serviceId}/edit`);
  await page.locator('input[type="file"]').setInputFiles(imagePath ?? "");
  await page.getByLabel(/Alt text/).fill("Vakratund construction service cover");
  await page.getByRole("button", { name: "Upload selected" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: "Save service" }).click();
  await expect(page).toHaveURL(/\/admin\/services$/);

  await page.goto(`/services/${serviceSlug}`);
  await expect(page.getByRole("img", { name: "Vakratund construction service cover" })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("button", { name: /Services/ }).click();
  await expect(page.getByRole("img", { name: "Vakratund construction service cover" })).toBeVisible();

  await page.goto("/admin/pages");
  const storySection = page.locator("section").filter({ hasText: "Our story image" }).first();
  await storySection.locator('input[type="file"]').setInputFiles(imagePath ?? "");
  await storySection.getByLabel(/Alt text/).fill("Vakratund team and construction work");
  await storySection.getByRole("button", { name: "Upload selected" }).click();
  await expect(storySection.getByText("Saved", { exact: true })).toBeVisible({ timeout: 60_000 });
  await storySection.getByRole("button", { name: "Save section" }).click();
  await page.goto("/about");
  await expect(page.getByRole("img", { name: "Vakratund team and construction work" })).toBeVisible();
});
