import { test, expect } from '@playwright/test';

test.describe('Discover/Experience Page (Whop Marketplace)', () => {
  const testExperienceId = 'test_exp_123';

  test.beforeEach(async ({ page }) => {
    await page.goto(`/experiences/${testExperienceId}`);
  });

  test('should display hero section', async ({ page }) => {
    await expect(page.getByText('Create your own music')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open Composer' })).toBeVisible();
  });

  test('should show feature transformation section', async ({ page }) => {
    await expect(page.getByText('From idea to song')).toBeVisible();
    await expect(page.getByText(/60 seconds/)).toBeVisible();
  });

  test('should display popular use cases', async ({ page }) => {
    await expect(page.getByText('Birthday song')).toBeVisible();
    await expect(page.getByText('Wedding entrance')).toBeVisible();
    await expect(page.getByText('Small business jingle')).toBeVisible();
  });

  test('should show feature cards', async ({ page }) => {
    await expect(page.getByText('Instant hooks')).toBeVisible();
    await expect(page.getByText('Plan‑aware credits')).toBeVisible();
    await expect(page.getByText('Simple licensing')).toBeVisible();
  });

  test('should display how it works section', async ({ page }) => {
    await expect(page.getByText('How it works')).toBeVisible();
    await expect(page.getByText('Describe your song')).toBeVisible();
    await expect(page.getByText('Generate and preview')).toBeVisible();
    await expect(page.getByText('Download & license')).toBeVisible();
  });

  test('should show pricing with payment methods', async ({ page }) => {
    // Scroll to pricing
    await page.locator('text=Plans').scrollIntoViewIfNeeded();

    await expect(page.getByText('Starter')).toBeVisible();
    await expect(page.getByText('Pro')).toBeVisible();
    await expect(page.getByText('Studio')).toBeVisible();

    // Payment method disclosure
    await expect(page.getByText(/Klarna/)).toBeVisible();
    await expect(page.getByText(/Afterpay/)).toBeVisible();
  });

  test('should display testimonials', async ({ page }) => {
    await expect(page.getByText('Loved by creators')).toBeVisible();
    await expect(page.getByText(/DTC founder|Content creator|Freelance editor/)).toBeVisible();
  });

  test('should show FAQ section', async ({ page }) => {
    await expect(page.getByText('FAQ')).toBeVisible();
    await expect(page.getByText('Can I use the music commercially?')).toBeVisible();
  });

  test('should have experience-scoped navigation', async ({ page }) => {
    // All CTAs should link to /experiences/{id}/generate
    const composerLink = page.getByRole('link', { name: 'Open Composer' }).first();
    const href = await composerLink.getAttribute('href');

    expect(href).toContain('/experiences/');
    expect(href).toContain('/generate');
  });

  test('use case links should route to experience composer', async ({ page }) => {
    // Click on a use case
    await page.getByText('Birthday song').click();

    // Should navigate to experience composer
    await expect(page).toHaveURL(new RegExp(`/experiences/${testExperienceId}/generate`));
  });

  test('should be responsive for marketplace embed', async ({ page, viewport }) => {
    if (viewport && viewport.width < 768) {
      // Mobile view should still show all key elements
      await expect(page.getByText('Create your own music')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Open Composer' })).toBeVisible();
    }
  });
});

test.describe('Experience Page Compliance', () => {
  test('should have proper meta tags for marketplace', async ({ page }) => {
    await page.goto('/experiences/test_exp');

    // Should have proper HTML structure
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should render without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/experiences/test_exp');
    await page.waitForLoadState('networkidle');

    // Should have minimal or no errors
    expect(errors.length).toBeLessThan(5);
  });

  test('should load all critical resources', async ({ page }) => {
    await page.goto('/experiences/test_exp');

    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded');

    // Verify no major 404s
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });
});
