import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display main hero section', async ({ page }) => {
    await expect(page.getByText('Create your own music')).toBeVisible();
    await expect(page.getByText(/Musician generates ready‑to‑use music/)).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Open Composer' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Pricing' })).toBeVisible();
  });

  test('should display all pricing plans', async ({ page }) => {
    await page.getByRole('link', { name: 'See pricing' }).click();

    await expect(page.getByText('Starter')).toBeVisible();
    await expect(page.getByText('Pro')).toBeVisible();
    await expect(page.getByText('Studio')).toBeVisible();

    // Verify pricing
    await expect(page.getByText('$9.99/mo')).toBeVisible();
    await expect(page.getByText('$29.99/mo')).toBeVisible();
    await expect(page.getByText('$49.99/mo')).toBeVisible();
  });

  test('should display payment method options (B1 compliance)', async ({ page }) => {
    await page.getByRole('link', { name: 'See pricing' }).click();

    // Verify new payment method disclosure
    await expect(page.getByText(/Flexible payment options/)).toBeVisible();
    await expect(page.getByText(/Klarna/)).toBeVisible();
    await expect(page.getByText(/Afterpay/)).toBeVisible();
    await expect(page.getByText(/100\+ payment methods/)).toBeVisible();
  });

  test('should display popular use cases', async ({ page }) => {
    await expect(page.getByText('Birthday song')).toBeVisible();
    await expect(page.getByText('Wedding entrance')).toBeVisible();
    await expect(page.getByText('Small business jingle')).toBeVisible();
    await expect(page.getByText('Reels background')).toBeVisible();
  });

  test('should display FAQ section', async ({ page }) => {
    await expect(page.getByText('FAQ')).toBeVisible();
    await expect(page.getByText('Can I use the music commercially?')).toBeVisible();
    await expect(page.getByText('Do I need music theory?')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page, viewport }) => {
    if (viewport && viewport.width < 768) {
      await expect(page.getByText('Create your own music')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Open Composer' })).toBeVisible();
    }
  });
});
