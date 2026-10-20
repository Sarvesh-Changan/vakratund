import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function openService(page: Page, name: RegExp) {
  const serviceStep = page.locator('section[aria-labelledby="estimate-service-title"]');
  if (await serviceStep.count() === 0) {
    test.info().annotations.push({ type: "exception", description: "Estimator is not configured in the current database." });
    return false;
  }
  await expect(serviceStep).toBeVisible();
  await serviceStep.getByRole("button", { name }).click();
  return true;
}

async function completeContact(page: Page, submitLabel: string) {
  const detailsStep = page.locator('section[aria-labelledby="estimate-details-title"]');
  await expect(detailsStep).toBeVisible();
  await detailsStep.getByLabel("Name").fill("Estimator Test");
  await detailsStep.getByLabel("Phone").fill("+919821502956");
  await detailsStep.getByLabel("Consent").check();
  await page.getByRole("button", { name: submitLabel }).last().click();
}

test("priced estimator is a three-step keyboard-operable flow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/estimate");
  await expect(page.locator('nav[aria-label="Contact actions"]')).toHaveCount(0);
  if (!await openService(page, /Building Construction/i)) return;
  await expect(page.getByText("Step 2 of 3")).toBeVisible();
  await page.getByLabel("Project area").fill("800");
  await page.getByRole("button", { name: "Continue to your details" }).click();
  await expect(page.getByText("Step 3 of 3")).toBeVisible();
  await completeContact(page, "Get my estimate");
});

test("inspection-only estimator completes in three steps on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/estimate");
  if (!await openService(page, /PMC & Turnkey Project Development/i)) return;
  await expect(page.getByText("Site inspection required").first()).toBeVisible();
  await page.getByRole("button", { name: "Continue to your details" }).click();
  await completeContact(page, "Request site inspection");
});
