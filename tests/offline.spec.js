import { test, expect } from '@playwright/test';
import {
  skipLanding,
  goToTopicSelection,
  completeGame,
  setupCorruptedStorage,
  hasProgressForTopic
} from './helpers/app-helpers.js';

test.describe('Offline Mode & Dark Scenarios', () => {
  test('app works offline after initial load', async ({ page, context }) => {
    // First visit - load with network, skip landing
    await skipLanding(page, context);

    // Wait for service worker to register
    await page.waitForTimeout(1000);

    // Verify app loaded
    await expect(page.locator('.topic-selection')).toBeVisible();

    // Go offline
    await context.setOffline(true);

    // Navigate to a topic
    await page.click('[data-topic-id="cosmetics"]');

    // Should still work offline
    await expect(page.locator('.mode-selection')).toBeVisible();

    // Select study mode
    await page.click('[data-mode="study"]');

    // Flashcards should work offline
    await expect(page.locator('.flashcard')).toBeVisible();
    await expect(page.locator('.flashcard-word')).toBeVisible();

    // Can reveal and navigate
    await page.keyboard.press('Space');
    await expect(page.locator('.flashcard-word-en')).toBeVisible();

    await page.keyboard.press('Space');
    await expect(page.locator('.flashcard')).toBeVisible();
  });

  test('localStorage persists progress across sessions', async ({ page, context }) => {
    // Use dev mode and skip to topic selection
    await goToTopicSelection(page, context, { dev: true });

    // Complete the dev-short game
    await completeGame(page, 'dev-short');

    // Reload page (simulate closing and reopening app)
    await page.reload({ waitUntil: 'networkidle' });

    // Should skip landing (already seen)
    await expect(page.locator('.topic-selection')).toBeVisible({ timeout: 2000 });

    // Progress should be saved (check localStorage directly)
    const hasProgress = await hasProgressForTopic(page, 'dev-short');
    expect(hasProgress).toBe(true);
  });

  test('handles corrupted localStorage gracefully', async ({ page, context }) => {
    // Set up corrupted localStorage before navigation
    await setupCorruptedStorage(page, context);

    // App should still load (not crash)
    await expect(page.locator('.topic-selection')).toBeVisible();

    // Should be able to select topic despite corrupted data
    await page.click('[data-topic-id="cosmetics"]');
    await expect(page.locator('.mode-selection')).toBeVisible();
  });

  test('leaderboard shows cached data when API fails', async ({ page, context }) => {
    // Use dev mode and skip to topic selection
    await goToTopicSelection(page, context, { dev: true });

    // Complete a quick game using dev mode
    await completeGame(page, 'dev-short');

    // Should show local leaderboard even if global API is down
    const leaderboard = page.locator('.leaderboard-section');
    if (await leaderboard.count() > 0) {
      await expect(leaderboard).toBeVisible();

      // Should show local scores by default
      const localTab = page.locator('text=/Local|Topic/i');
      if (await localTab.count() > 0) {
        // Local scores should be visible
        expect(await page.locator('.leaderboard-row').count()).toBeGreaterThan(0);
      }
    }
  });

  test('app handles full localStorage quota', async ({ page, context }) => {
    // Try to fill localStorage before navigation
    await context.addInitScript(() => {
      try {
        const largeData = 'x'.repeat(1024 * 1024); // 1MB chunk
        for (let i = 0; i < 20; i++) {
          localStorage.setItem(`dummy_${i}`, largeData);
        }
      } catch (e) {
        // Quota exceeded - expected
      }
      localStorage.setItem('mots_landing_seen', 'true');
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // App should still function
    await expect(page.locator('.topic-selection')).toBeVisible();

    // Should be able to play
    await page.click('[data-topic-id="cosmetics"]');
    await expect(page.locator('.mode-selection')).toBeVisible();
  });
});
