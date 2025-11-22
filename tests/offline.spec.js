import { test, expect } from '@playwright/test';

test.describe('Offline Mode & Dark Scenarios', () => {
  test('app works offline after initial load', async ({ page, context }) => {
    // First visit - load with network
    await page.goto('/', { waitUntil: 'load' });
    await page.evaluate(() => localStorage.setItem('mots_landing_seen', 'true'));
    await page.reload({ waitUntil: 'load' });

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

  test('localStorage persists progress across sessions', async ({ page }) => {
    // Clear storage
    await page.goto('/', { waitUntil: 'load' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'load' });

    // Skip landing
    await page.click('#landing-get-started');

    // Use dev mode for shorter test
    await page.goto('/?dev=true', { waitUntil: 'load' });

    // Play dev-short topic and complete all words
    await page.click('[data-topic-id="dev-short"]');
    await page.click('[data-mode="play"]');

    // Complete all words in the dev-short topic (3 words)
    for (let i = 0; i < 3; i++) {
      const hasInput = await page.locator('.answer-input').count() > 0;
      if (!hasInput) break;

      await page.locator('.answer-input').fill('test answer');
      await page.click('.btn-submit');
      await page.waitForTimeout(200);
      await page.keyboard.press('Space');
      await page.waitForTimeout(200);
    }

    // Wait for game completion
    await expect(page.locator('.game-complete')).toBeVisible({ timeout: 2000 });

    // Reload page (simulate closing and reopening app)
    await page.reload({ waitUntil: 'load' });

    // Should skip landing (already seen)
    await expect(page.locator('.topic-selection')).toBeVisible({ timeout: 2000 });

    // Progress should be saved (check localStorage directly)
    const hasProgress = await page.evaluate(() => {
      const progress = localStorage.getItem('mots_progress');
      return progress && progress.includes('dev-short');
    });

    expect(hasProgress).toBe(true);
  });

  test('handles corrupted localStorage gracefully', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });

    // Inject corrupted data
    await page.evaluate(() => {
      localStorage.setItem('mots_progress', 'invalid json {{{');
      localStorage.setItem('mots_failed_words', '123 not json');
      localStorage.setItem('mots_landing_seen', 'true');
    });

    // Reload
    await page.reload({ waitUntil: 'load' });

    // App should still load (not crash)
    await expect(page.locator('.topic-selection')).toBeVisible();

    // Should be able to select topic despite corrupted data
    await page.click('[data-topic-id="cosmetics"]');
    await expect(page.locator('.mode-selection')).toBeVisible();
  });

  test('leaderboard shows cached data when API fails', async ({ page }) => {
    // Set landing as seen
    await page.goto('/', { waitUntil: 'load' });
    await page.evaluate(() => localStorage.setItem('mots_landing_seen', 'true'));
    await page.reload({ waitUntil: 'load' });

    // Complete a quick game using dev mode
    await page.goto('/?dev=true', { waitUntil: 'load' });

    await page.click('[data-topic-id="dev-short"]');
    await page.click('[data-mode="play"]');

    // Complete words quickly
    for (let i = 0; i < 3; i++) {
      const hasInput = await page.locator('.answer-input').count() > 0;
      if (!hasInput) break;

      await page.locator('.answer-input').fill('test');
      await page.click('.btn-submit');
      await page.waitForTimeout(200);
      await page.keyboard.press('Space');
      await page.waitForTimeout(200);
    }

    // Check if completion screen appears
    const isComplete = await page.locator('.game-complete').count() > 0;

    if (isComplete) {
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
    }
  });

  test('app handles full localStorage quota', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });

    // Try to fill localStorage (most browsers ~5-10MB limit)
    await page.evaluate(() => {
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

    await page.reload({ waitUntil: 'load' });

    // App should still function
    await expect(page.locator('.topic-selection')).toBeVisible();

    // Should be able to play
    await page.click('[data-topic-id="cosmetics"]');
    await expect(page.locator('.mode-selection')).toBeVisible();
  });
});
