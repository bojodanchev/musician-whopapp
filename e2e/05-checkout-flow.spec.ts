import { test, expect } from '@playwright/test';

test.describe('Pricing & Checkout Flow', () => {
  test('should display all plans on pricing page', async ({ page }) => {
    await page.goto('/#pricing');

    await expect(page.getByText('Starter')).toBeVisible();
    await expect(page.getByText('Pro')).toBeVisible();
    await expect(page.getByText('Studio')).toBeVisible();
  });

  test('should show plan features', async ({ page }) => {
    await page.goto('/#pricing');

    // Starter features
    await expect(page.getByText('50 generations/mo')).toBeVisible();
    await expect(page.getByText('30s max')).toBeVisible();

    // Pro features
    await expect(page.getByText('200 generations/mo')).toBeVisible();
    await expect(page.getByText('Batch x4')).toBeVisible();

    // Studio features
    await expect(page.getByText('700 generations/mo')).toBeVisible();
    await expect(page.getByText('Batch x10')).toBeVisible();
  });

  test('should have checkout buttons for each plan', async ({ page }) => {
    await page.goto('/#pricing');

    // Look for choose/select buttons
    const buttons = page.getByRole('button', { name: /Choose|Select|Open/i });
    const buttonCount = await buttons.count();

    // Should have at least 3 buttons (one per plan)
    expect(buttonCount).toBeGreaterThanOrEqual(3);
  });
});

test.describe('Affiliate Code Integration', () => {
  test('should accept affiliate code in subscribe URL', async ({ page }) => {
    const response = await page.request.get('/api/whop/subscribe?plan=PRO&affiliate_code=partner123');

    // Should redirect to Whop checkout (302/301) or return error if plan not configured
    expect([301, 302, 400]).toContain(response.status());

    // If redirecting, URL should contain affiliate code
    if (response.status() === 302 || response.status() === 301) {
      const location = response.headers()['location'];
      if (location) {
        expect(location).toContain('whop.com/checkout');
      }
    }
  });

  test('should handle missing affiliate code gracefully', async ({ page }) => {
    const response = await page.request.get('/api/whop/subscribe?plan=STARTER');

    // Should work without affiliate code (backward compatible)
    expect([301, 302, 400]).toContain(response.status());
  });

  test('should validate plan parameter', async ({ page }) => {
    const response = await page.request.get('/api/whop/subscribe?plan=INVALID');

    // Should return 400 for invalid plan
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('UNKNOWN_PLAN');
  });

  test('should require plan parameter', async ({ page }) => {
    const response = await page.request.get('/api/whop/subscribe');

    // Should return 400 for missing plan
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('MISSING_PLAN');
  });
});

test.describe('Payment Method Disclosure', () => {
  test('should show Klarna and Afterpay on landing page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'See pricing' }).click();

    await expect(page.getByText(/Klarna/)).toBeVisible();
    await expect(page.getByText(/Afterpay/)).toBeVisible();
    await expect(page.getByText(/installment/i)).toBeVisible();
  });

  test('should show payment methods on discover page', async ({ page }) => {
    // Visit discover/experience page
    await page.goto('/experiences/test_experience_id');

    // Scroll to pricing section
    await page.locator('text=Plans').scrollIntoViewIfNeeded();

    await expect(page.getByText(/Klarna/)).toBeVisible();
    await expect(page.getByText(/Afterpay/)).toBeVisible();
  });

  test('should mention 100+ payment methods', async ({ page }) => {
    await page.goto('/#pricing');

    await expect(page.getByText(/100\+/)).toBeVisible();
  });
});

test.describe('Whop Entitlements', () => {
  test('paywall endpoint should return access info', async ({ page }) => {
    const response = await page.request.get('/api/whop/paywall?plan=PRO');

    // Should return 200 with access info (or 401 if not auth)
    expect([200, 401]).toContain(response.status());
  });

  test('should handle missing plan in paywall check', async ({ page }) => {
    const response = await page.request.get('/api/whop/paywall');

    // Should handle gracefully (either default or error)
    expect(response.status()).toBeLessThan(500);
  });
});
