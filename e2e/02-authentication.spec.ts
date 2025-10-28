import { test, expect } from '@playwright/test';

test.describe('Authentication & Security (B1 Fix)', () => {
  test('library page should require authentication', async ({ page }) => {
    // B1 Regression: Verify /library requires authentication
    await page.goto('/library');

    // Should show authentication required message (not list assets)
    await expect(page.getByText('Authentication Required')).toBeVisible();
    await expect(page.getByText('You must be logged in to view your library')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to Generator' })).toBeVisible();
  });

  test('library page should not expose asset list without auth', async ({ page }) => {
    // B1 Security: Ensure no assets are rendered when unauthenticated
    await page.goto('/library');

    // Should NOT see any asset titles, download buttons, or audio players
    const assetElements = page.locator('audio[controls]');
    await expect(assetElements).toHaveCount(0);

    const downloadButtons = page.getByRole('link', { name: /WAV/ });
    await expect(downloadButtons).toHaveCount(0);
  });

  test('asset download API should reject unauthenticated requests', async ({ page }) => {
    // B2 Security: Direct API access should fail without auth
    const response = await page.request.get('/api/assets');

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('UNAUTHENTICATED');
  });

  test('asset download by ID should reject without ownership', async ({ page }) => {
    // B2 Security: Cannot download asset without ownership
    const fakeAssetId = 'asset_123456789';
    const response = await page.request.get(`/api/assets/${fakeAssetId}/download`);

    // Should return 401 (no auth) or 404 (not found/not owned)
    expect([401, 404]).toContain(response.status());
  });

  test('license download should require authentication', async ({ page }) => {
    // B3 Security: License endpoint requires auth
    const fakeAssetId = 'asset_123456789';
    const response = await page.request.post(`/api/licenses/${fakeAssetId}`);

    expect(response.status()).toBe(401);
  });
});

test.describe('Whop Authentication Flow', () => {
  test('should handle missing Whop token gracefully', async ({ page }) => {
    // Visit library without Whop iframe context
    await page.goto('/library');

    // Should show auth screen (not crash)
    await expect(page.getByText('Authentication Required')).toBeVisible();
  });

  test('diagnostics endpoint should return system info', async ({ page }) => {
    // Visit diagnostics to verify app health
    const response = await page.request.get('/api/diagnostics');

    // Should return 200 or 401 (depending on auth)
    expect([200, 401]).toContain(response.status());
  });
});
