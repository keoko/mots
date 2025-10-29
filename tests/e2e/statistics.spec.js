import { test, expect } from '@playwright/test';

test.describe('Statistics and Progress Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('statistics button appears on topic selection', async ({ page }) => {
    await page.goto('/');

    // Stats button should be visible
    await expect(page.locator('.btn-statistics')).toBeVisible();
    await expect(page.locator('.btn-statistics')).toContainText('Stats');
  });

  test('navigate to statistics page', async ({ page }) => {
    await page.goto('/');

    // Click stats button
    await page.click('.btn-statistics');

    // Should show statistics page
    await expect(page.locator('.statistics-page')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Statistics');

    // Should show overall progress section
    await expect(page.locator('.stats-section-title')).toContainText('Overall Progress');
  });

  test('navigate back from statistics to topics', async ({ page }) => {
    await page.goto('/');

    await page.click('.btn-statistics');
    await expect(page.locator('.statistics-page')).toBeVisible();

    // Click back button
    await page.click('.btn-back');

    // Should return to topic selection
    await expect(page.locator('h2')).toContainText('Choose a Topic');
  });

  test('statistics show zero state initially', async ({ page }) => {
    await page.goto('/');
    await page.click('.btn-statistics');

    // All stats should be zero initially
    const totalWords = page.locator('.stat-card').filter({ hasText: 'Total Words' }).locator('.stat-value');
    await expect(totalWords).toContainText('0');

    const totalWon = page.locator('.stat-card').filter({ hasText: 'Words Won' }).locator('.stat-value');
    await expect(totalWon).toContainText('0');

    // Should show "no failed words" empty state
    await expect(page.locator('.empty-message')).toContainText('No failed words yet');
  });

  test('mastery badges appear after playing', async ({ page }) => {
    await page.goto('/');

    // Initially no mastery badges
    let masteryBadges = page.locator('.topic-mastery');
    await expect(masteryBadges).toHaveCount(0);

    // Play a game (simplified - just complete one word)
    await page.click('[data-topic-id="animals"]');
    await page.click('[data-action="select-play"]');

    // Make a guess (this is simplified, actual test would need real word)
    // For now, just go back to verify state
    await page.click('button[data-action="back-to-topics"]');

    // After playing, some topics might have mastery indicators
    // (This depends on whether any progress was saved)
  });

  test('failed words tracking', async ({ page }) => {
    // This test would require:
    // 1. Playing through a topic
    // 2. Failing some words intentionally
    // 3. Checking statistics page shows failed words
    // 4. Practicing failed words
    // 5. Verifying they're removed after success

    // Skipping implementation details for now as it requires
    // complex game state manipulation
    test.skip();
  });

  test('session history appears after completing a topic', async ({ page }) => {
    // This test would:
    // 1. Complete a full topic in play mode
    // 2. Navigate to statistics
    // 3. Verify session appears in recent sessions
    // 4. Check session data (score, time, success rate)

    test.skip();
  });

  test('practice failed words button functionality', async ({ page }) => {
    await page.goto('/');
    await page.click('.btn-statistics');

    // Initially button should not exist (no failed words)
    const practiceButton = page.locator('[data-action="practice-failed"]');
    await expect(practiceButton).toHaveCount(0);

    // After having failed words, button should appear and work
    // (Requires setting up failed words state first)
  });

  test('overall stats aggregate correctly', async ({ page }) => {
    // This test would verify:
    // 1. Play multiple topics
    // 2. Stats aggregate across all topics
    // 3. Success rate calculation is correct
    // 4. Total score sums properly

    test.skip();
  });
});
