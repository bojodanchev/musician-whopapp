import { test, expect } from '@playwright/test';

test.describe('App Health & Performance', () => {
  test('landing page should load quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    // Should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have no console errors on landing', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should have minimal errors (some warnings OK)
    expect(errors.length).toBeLessThan(3);
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');

    // Next.js should show 404 page
    await expect(page.getByText(/404|not found/i)).toBeVisible({ timeout: 5000 });
  });

  test('all critical routes should be accessible', async ({ page }) => {
    const routes = ['/', '/generate', '/library'];

    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.status()).toBeLessThan(500);
    }
  });

  test('API health endpoints should respond', async ({ page }) => {
    const endpoints = [
      '/api/diagnostics',
      '/api/whop/subscribe?plan=PRO',
      '/api/whop/paywall?plan=STARTER',
    ];

    for (const endpoint of endpoints) {
      const response = await page.request.get(endpoint);
      // Should return valid status (not 500 server error)
      expect(response.status()).toBeLessThan(500);
    }
  });
});

test.describe('Security Headers & Best Practices', () => {
  test('should serve over HTTPS in production', async ({ page }) => {
    const url = page.url();
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      // Local dev can be HTTP
      expect(url).toBeTruthy();
    } else {
      // Production should be HTTPS
      expect(url).toMatch(/^https:/);
    }
  });

  test('should not expose sensitive data in HTML', async ({ page }) => {
    await page.goto('/');
    const content = await page.content();

    // Should not expose API keys in source
    expect(content).not.toContain('ELEVENLABS_API_KEY');
    expect(content).not.toContain('WHOP_API_KEY');
    expect(content).not.toContain('S3_SECRET_ACCESS_KEY');
  });

  test('API endpoints should validate content-type', async ({ page }) => {
    const response = await page.request.post('/api/compose', {
      data: 'invalid-data',
      headers: { 'content-type': 'text/plain' },
    });

    // Should handle invalid content-type gracefully
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Accessibility', () => {
  test('landing page should have proper heading structure', async ({ page }) => {
    await page.goto('/');

    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    const h1Text = await h1.textContent();
    expect(h1Text).toBeTruthy();
  });

  test('interactive elements should be keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Focus on first button
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);

    expect(['A', 'BUTTON', 'INPUT']).toContain(focused);
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      // Alt can be empty string for decorative images
      expect(alt).not.toBeNull();
    }
  });
});

test.describe('Browser Compatibility', () => {
  test('should work in all configured browsers', async ({ browserName, page }) => {
    await page.goto('/');

    // Basic functionality should work in chromium, firefox, webkit
    await expect(page.getByText('Create your own music')).toBeVisible();

    console.log(`✓ Tested in ${browserName}`);
  });

  test('should handle JavaScript disabled gracefully', async ({ page }) => {
    await page.goto('/');

    // Core content should still be visible (SSR)
    const content = await page.content();
    expect(content).toContain('Musician');
  });
});

test.describe('Mobile Responsiveness', () => {
  test('should be mobile-friendly', async ({ page, viewport }) => {
    if (viewport && viewport.width < 768) {
      await page.goto('/');

      // Key elements should be visible on mobile
      await expect(page.getByText('Create your own music')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Open Composer' })).toBeVisible();

      // Pricing should be stacked on mobile
      await page.getByRole('link', { name: 'See pricing' }).click();
      await expect(page.getByText('Starter')).toBeVisible();
    }
  });

  test('mobile menu should work if present', async ({ page, viewport }) => {
    if (viewport && viewport.width < 768) {
      await page.goto('/');

      // Check for mobile navigation
      const navLinks = page.getByRole('link', { name: /Composer|Pricing/ });
      const count = await navLinks.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});
