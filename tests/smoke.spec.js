import { test, expect } from '@playwright/test';

test('app loads successfully', async ({ page }) => {
  await page.goto('http://localhost:8000');

  // Check page title
  await expect(page).toHaveTitle(/Mots/);

  // Check main heading exists
  const heading = page.locator('h1');
  await expect(heading).toBeVisible();
});

test('landing page shows on first visit', async ({ page }) => {
  // Clear localStorage to simulate first visit
  await page.goto('http://localhost:8000');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // Should see landing page
  await expect(page.locator('.landing-page')).toBeVisible();
  await expect(page.locator('.landing-title')).toContainText('Welcome to Mots');

  // Click Get Started
  await page.click('#landing-get-started');

  // Should navigate to topic selection
  await expect(page.locator('.topic-selection')).toBeVisible();
});
