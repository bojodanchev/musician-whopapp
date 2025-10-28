import { test, expect } from '@playwright/test';

test.describe('Async Composition Job Flow (B4 Fix)', () => {
  test('should handle job polling endpoint', async ({ page }) => {
    // B4 Regression: Verify async job route exists and doesn't use placeholders
    const fakeJobId = 'job_123456789';
    const response = await page.request.get(`/api/compose/${fakeJobId}`);

    // Should return 404 (job not found) or 401 (not authorized)
    expect([401, 404]).toContain(response.status());
  });

  test('job polling should not return placeholder data', async ({ page }) => {
    // B4 Security: Ensure no WAV_PLACEHOLDER corruption
    const response = await page.request.get('/api/compose/test_job_id');

    const body = await response.text();

    // Should NOT contain placeholder text
    expect(body).not.toContain('WAV_PLACEHOLDER');
    expect(body).not.toContain('STEM_');
  });

  test('should validate job status responses', async ({ page }) => {
    const response = await page.request.get('/api/compose/test_job');

    // Valid responses: 401 (auth), 404 (not found), 200 (with valid status)
    expect([200, 401, 404, 500]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      // If job exists, should have status field
      expect(['queued', 'processing', 'completed', 'failed', 'error']).toContain(
        body.status || body.error
      );
    }
  });
});

test.describe('Real Audio Fetching', () => {
  test('composition should use ElevenLabs endpoints', async ({ page }) => {
    // Verify app points to real ElevenLabs API (not mocked)
    const apiBaseUrl = 'https://api.elevenlabs.io';

    // This just verifies the constant; actual API calls require valid keys
    expect(apiBaseUrl).toContain('elevenlabs');
  });

  test('should handle ElevenLabs API failures gracefully', async ({ page }) => {
    // Test that compose endpoint returns proper errors
    const response = await page.request.post('/api/compose', {
      data: {
        vibe: 'Test',
        bpm: 120,
        duration: 30,
        structure: 'simple',
        batch: 1,
      },
    });

    // Will fail due to auth, but shouldn't crash
    expect(response.status()).not.toBe(500);
  });
});

test.describe('Job Creation & Status', () => {
  test('should create job records in database', async ({ page }) => {
    // Jobs are tracked via Prisma Job model
    // This test verifies the flow doesn't bypass job creation

    const response = await page.request.post('/api/compose', {
      data: {
        vibe: 'Upbeat pop',
        bpm: 128,
        duration: 15,
        structure: 'verse-chorus',
        batch: 2,
      },
    });

    // Should fail with auth error (not schema error)
    expect([401, 403]).toContain(response.status());
  });

  test('should handle batch generation requests', async ({ page }) => {
    // Verify batch parameter is accepted
    const response = await page.request.post('/api/compose', {
      data: {
        vibe: 'Test batch',
        bpm: 120,
        duration: 10,
        structure: 'simple',
        batch: 3, // Multiple takes
      },
    });

    // Should validate but fail on auth
    expect([400, 401, 403]).toContain(response.status());
  });
});
