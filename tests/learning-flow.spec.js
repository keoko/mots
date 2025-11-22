import { test, expect } from '@playwright/test';
import {
  setupCleanApp,
  goToTopicSelection,
  completeGame,
  startStudyMode,
  startPlayMode
} from './helpers/app-helpers.js';

test.describe('Complete Learning Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear storage to start fresh
    await setupCleanApp(page, context);
  });

  test('study mode: complete topic flow', async ({ page, context }) => {
    // Skip landing page and go to topics
    await expect(page.locator('.landing-page')).toBeVisible();
    await page.click('#landing-get-started');
    await expect(page.locator('.topic-selection')).toBeVisible();

    // Start study mode
    await startStudyMode(page, 'cosmetics');

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

  test('play mode: submit answer and continue', async ({ page, context }) => {
    // Skip landing and go to topics
    await page.click('#landing-get-started');
    await expect(page.locator('.topic-selection')).toBeVisible();

    // Start play mode
    await startPlayMode(page, 'cosmetics');

    // Play mode: should see Catalan word prompt
    await expect(page.locator('.prompt-word')).toBeVisible();

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

  test('complete full topic and see statistics', async ({ page, context }) => {
    // Use dev mode and skip to topic selection
    await goToTopicSelection(page, context, { dev: true });

    // Complete the dev-short game
    await completeGame(page, 'dev-short');

    // Completion screen should be visible
    await expect(page.locator('[data-action="back-to-topics"]')).toBeVisible();

    // Back to topics should work
    await page.click('button:has-text("← Topics")');
    await expect(page.locator('.topic-selection')).toBeVisible();

    // Topic card should now show progress
    const topicCard = page.locator('.topic-card').first();
    await expect(topicCard).toContainText(/Learning|Proficient|Mastered/);
  });
});
