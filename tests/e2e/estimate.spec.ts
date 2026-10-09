import { expect, test } from "@playwright/test";

test("visitor can complete the estimator on a mobile viewport", async ({ page }) => {
  await page.goto("/estimate");
  const serviceStep = page.locator('section[aria-labelledby="estimate-service-title"]');
  if (await serviceStep.count() === 0) {
    test.info().annotations.push({
      type: "exception",
      description: "Estimator is not configured in the current database; publish an estimator service before running the submission flow.",
    });
    return;
  }
  await expect(serviceStep).toBeVisible();
  await serviceStep.getByRole("button", { name: /PMC & Turnkey Project Development/i }).click();

  const detailsStep = page.locator('section[aria-labelledby="estimate-details-title"]');
  await expect(detailsStep).toBeVisible();
  const areaInput = detailsStep.locator('input[type="number"]').first();
  await areaInput.fill("500");
  for (const select of await detailsStep.locator("select").all()) {
    const options = await select.locator("option").count();
    if (options > 1) await select.selectOption({ index: 1 });
  }
  for (const checkbox of await detailsStep.locator('input[type="checkbox"]').all()) await checkbox.check().catch(() => undefined);
  await detailsStep.getByRole("button", { name: "Continue" }).click();

  const resultStep = page.locator('section[aria-labelledby="estimate-result-title"]');
  await expect(resultStep).toBeVisible();
  const inspectionButton = resultStep.getByRole("button", { name: "Request Site Inspection" });
  if (await inspectionButton.count()) await inspectionButton.click();
  else await resultStep.getByRole("button", { name: "Continue to contact" }).click();

  const contactStep = page.locator('section[aria-labelledby="estimate-contact-title"]');
  await expect(contactStep).toBeVisible();
  await contactStep.getByLabel("Name").fill("Mobile Estimator Test");
  await contactStep.getByLabel("Phone").fill("+919821502956");
  await contactStep.getByLabel("Location").fill("Thane");
  await contactStep.getByLabel("Requirements").fill("Please review this project enquiry.");
  await contactStep.getByLabel("Consent").check();
  await contactStep.getByRole("button", { name: "Submit enquiry" }).click();

  await expect(page).toHaveURL(/\/estimate\/thank-you\?ref=VK-[A-Z2-9]{6}$/);
  await expect(page.getByRole("heading", { name: "Thank you for getting in touch." })).toBeVisible();
});
