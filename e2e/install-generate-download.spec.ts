import { test, expect } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL;

test.describe("Musician smoke flow", () => {
  test("install → generate → download happy path", async ({ page }) => {
    test.skip(!baseUrl, "E2E_BASE_URL not configured");
    await page.goto(baseUrl!);
    await expect(page.getByText("Begin your musical journey.")).toBeVisible();

    await page.getByRole("link", { name: "Open Composer" }).first().click();
    await page.getByPlaceholder("Describe your song...").fill("Playwright generated hook");
    await page.getByRole("button", { name: "Generate" }).click();

    await page.waitForTimeout(1000);
    await page.getByText(/Recent projects/i).waitFor();
    await expect(page.locator('a:has-text("Download")').first()).toBeVisible();
  });
});
