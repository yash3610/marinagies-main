import { expect, test } from "@playwright/test";

test("public website loads and protected dashboard redirects to login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/MarineAegis/i);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Login", exact: true })).toBeVisible();
});

test("administrator can sign in and run the GPS spoofing demonstration", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("Email Address*").fill("e2e-admin@marineaegis.test");
  await page.getByPlaceholder("Password*").fill("MarineE2E@2026");
  await page.locator("#login-terms").evaluate((checkbox) => {
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("form.form-wrapper").evaluate((form) => form.requestSubmit());

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Fleet Overview", exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Attack Simulation", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Attack Simulation", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "MV E2E Guardian", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Start Voyage", exact: true }).click();
  await expect(page.getByText("Voyage simulation started", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "Inject GPS Spoofing", exact: true }).click();
  await expect(page.getByText("GPS spoofing injected", { exact: false })).toBeVisible();
  await expect(page.getByText("GPS SPOOFING", { exact: true })).toBeVisible();
});
