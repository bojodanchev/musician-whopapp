import { test, expect } from '@playwright/test';

test.describe('Music Composition UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/generate');
  });

  test('should display composer interface', async ({ page }) => {
    // Main composer should be visible
    await expect(page.locator('text=Composer').or(page.locator('text=Generate'))).toBeVisible({ timeout: 10000 });
  });

  test('should have prompt input field', async ({ page }) => {
    // Look for textarea or input for prompt
    const promptInput = page.locator('textarea, input[type="text"]').first();
    await expect(promptInput).toBeVisible({ timeout: 5000 });
  });

  test('should display BPM and duration controls', async ({ page }) => {
    // BPM control should be present
    await expect(page.getByText(/BPM|Tempo/i)).toBeVisible({ timeout: 5000 });

    // Duration control should be present
    await expect(page.getByText(/Duration|Length|seconds/i)).toBeVisible({ timeout: 5000 });
  });

  test('should show plan-based limitations', async ({ page }) => {
    // Without auth, should show upgrade prompts or trial info
    await expect(
      page.getByText(/credits|plan|upgrade|trial/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should display batch generation controls', async ({ page }) => {
    // Batch controls should exist
    const batchControl = page.getByText(/batch|variations|takes/i).first();
    await expect(batchControl).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Composition API Validation', () => {
  test('should reject composition without authentication', async ({ page }) => {
    const response = await page.request.post('/api/compose', {
      data: {
        vibe: 'Test track',
        bpm: 120,
        duration: 30,
        structure: 'verse-chorus',
        batch: 1,
      },
    });

    // Should fail without Whop token
    expect([401, 403]).toContain(response.status());
  });

  test('should validate composition schema', async ({ page }) => {
    const response = await page.request.post('/api/compose', {
      data: {
        vibe: '', // Invalid: empty vibe
        bpm: 500, // Invalid: out of range
        duration: 200, // Invalid: too long
        structure: 'x',
        batch: 1,
      },
    });

    // Should return 400 for validation errors
    expect(response.status()).toBe(400);
  });
});

test.describe('Preset Use Cases', () => {
  test('should load presets from landing page links', async ({ page }) => {
    await page.goto('/');

    // Click on "Birthday song" preset
    await page.getByText('Birthday song').click();

    // Should navigate to /generate with preset query
    await expect(page).toHaveURL(/\/generate/);
    await expect(page).toHaveURL(/preset=/);
  });
});
