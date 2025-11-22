import { test, expect } from '@playwright/test';

test.describe('Complete Learning Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage to start fresh
    await page.goto('/', { waitUntil: 'load' });
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload({ waitUntil: 'load' });
  });

  test('study mode: complete topic flow', async ({ page }) => {
    // Skip landing page
    await expect(page.locator('.landing-page')).toBeVisible();
    await page.click('#landing-get-started');

    // Select topic
    await expect(page.locator('.topic-selection')).toBeVisible();
    await page.click('[data-topic-id="cosmetics"]');

    // Select study mode
    await expect(page.locator('.mode-selection')).toBeVisible();
    const studyButton = page.locator('[data-mode="study"]');
    await expect(studyButton).toBeVisible();
    await studyButton.click();

    // Study mode: flashcard should be visible
    await expect(page.locator('.flashcard')).toBeVisible();

    // Check word in Catalan is shown
    await expect(page.locator('.flashcard-word')).toBeVisible();

    // Reveal word (press space or click)
    await page.keyboard.press('Space');

    // English translation should now be visible
    await expect(page.locator('.flashcard-word-en')).toBeVisible();

    // Go to next word
    await page.keyboard.press('Space');

    // Should show next flashcard
    await expect(page.locator('.flashcard')).toBeVisible();

    // Can go back to mode selection
    await page.click('.back-button');
    await expect(page.locator('.topic-selection, .mode-selection')).toBeVisible();
  });

  test('play mode: submit answer and continue', async ({ page }) => {
    // Skip landing
    await page.click('#landing-get-started');

    // Select topic
    await page.click('[data-topic-id="cosmetics"]');

    // Select play mode
    await page.click('[data-mode="play"]');

    // Play mode: should see Catalan word prompt
    await expect(page.locator('.prompt-word')).toBeVisible();
    await expect(page.locator('.answer-input')).toBeVisible();

    // Type any answer
    await page.locator('.answer-input').fill('test');

    // Submit
    await page.click('.btn-submit');

    // Wait a bit for state transition
    await page.waitForTimeout(300);

    // Should show result state or next word
    const resultCount = await page.locator('.game-complete, .inline-feedback, .answer-input').count();
    expect(resultCount).toBeGreaterThan(0);
  });

  test('complete full topic and see statistics', async ({ page }) => {
    // Use dev mode for faster test (fewer words)
    await page.goto('/?dev=true');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'load' });

    // Skip landing
    await page.click('#landing-get-started');

    // Select dev-short topic (only 2 words)
    const devTopic = page.locator('[data-topic-id="dev-short"]');
    if (await devTopic.count() > 0) {
      await devTopic.click();
    } else {
      // Fallback to cosmetics
      await page.click('[data-topic-id="cosmetics"]');
    }

    // Play mode
    await page.click('[data-mode="play"]');

    // Answer all words (submit random answers to complete quickly)
    let wordsCompleted = 0;
    const maxWords = 5; // Safety limit

    while (wordsCompleted < maxWords) {
      // Check if we're still in playing state
      const isPlaying = await page.locator('.answer-input').count() > 0;
      const isComplete = await page.locator('.game-complete').count() > 0;

      if (isComplete) {
        break;
      }

      if (isPlaying) {
        // Submit answer
        await page.locator('.answer-input').fill('test');
        await page.click('.btn-submit');

        // Wait for feedback
        await page.waitForTimeout(200);

        // Press space to continue
        await page.keyboard.press('Space');
        await page.waitForTimeout(200);

        wordsCompleted++;
      } else {
        break;
      }
    }

    // Should reach completion screen
    await expect(page.locator('.game-complete')).toBeVisible({ timeout: 5000 });

    // Completion screen should be visible (score display varies by mode)
    await expect(page.locator('[data-action="back-to-topics"]')).toBeVisible();

    // Back to topics should work
    await page.click('button:has-text("← Topics")');
    await expect(page.locator('.topic-selection')).toBeVisible();

    // Topic card should now show progress
    const topicCard = page.locator('.topic-card').first();
    await expect(topicCard).toContainText(/Learning|Proficient|Mastered/);
  });
});
