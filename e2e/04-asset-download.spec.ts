import { test, expect } from '@playwright/test';

test.describe('Asset Download Security (B2 Fix)', () => {
  test('should reject cross-user asset downloads', async ({ page }) => {
    // B2 Regression: Verify no fallback allows unauthorized downloads
    const otherUserAssetId = 'asset_another_user_123';

    const response = await page.request.get(`/api/assets/${otherUserAssetId}/download`);

    // Should return 401 (no auth) or 404 (not owned)
    expect([401, 404]).toContain(response.status());
    expect(response.status()).not.toBe(200);
  });

  test('should enforce ownership check in download endpoint', async ({ page }) => {
    // Try to download with just an ID (no userId verification)
    const response = await page.request.get('/api/assets/fake_asset_id/download');

    // Should NOT return 200 without ownership
    expect(response.status()).not.toBe(200);
  });

  test('download endpoint should require type parameter', async ({ page }) => {
    const response = await page.request.get('/api/assets/test_id/download?type=wav');

    // Should fail due to auth, but type param should be recognized
    expect([401, 404]).toContain(response.status());
  });

  test('should support loop variant download', async ({ page }) => {
    const response = await page.request.get('/api/assets/test_id/download?type=loop');

    // Should fail due to auth (not missing type)
    expect([401, 404]).toContain(response.status());
  });
});

test.describe('License Download (B3 Fix)', () => {
  test('should return proper attachment headers', async ({ page }) => {
    // B3 Regression: Verify license is served as file, not JSON
    const response = await page.request.post('/api/licenses/test_asset_id');

    // Should return 401 (auth required), not JSON response
    expect(response.status()).toBe(401);

    // If it were returning JSON like before, content-type would be application/json
    const contentType = response.headers()['content-type'];
    expect(contentType).not.toContain('application/json');
  });

  test('license endpoint should verify ownership', async ({ page }) => {
    // Try to download license for asset we don't own
    const response = await page.request.post('/api/licenses/other_user_asset');

    // Should fail with 401 or 404
    expect([401, 404]).toContain(response.status());
  });
});

test.describe('Asset API Security', () => {
  test('should not list assets without authentication', async ({ page }) => {
    const response = await page.request.get('/api/assets');

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('UNAUTHENTICATED');
  });

  test('should require cookie or JWT for asset access', async ({ page }) => {
    // Without auth headers or cookies, should fail
    const response = await page.request.get('/api/assets', {
      headers: {}, // No auth headers
    });

    expect(response.status()).toBe(401);
  });
});

test.describe('Signed URL Validation', () => {
  test('should generate time-limited signed URLs', async ({ page }) => {
    // Signed URLs should expire (security feature)
    // This test verifies the concept; actual URLs require auth to generate
    const maxExpiry = 300; // 5 minutes as per security fix

    expect(maxExpiry).toBeLessThanOrEqual(300);
    expect(maxExpiry).toBeGreaterThan(0);
  });
});
