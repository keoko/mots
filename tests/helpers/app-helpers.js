import { expect } from '@playwright/test';

/**
 * Set up a clean app state by clearing localStorage before navigation
 * Avoids race conditions with app initialization
 */
export async function setupCleanApp(page, context) {
  // Clear storage BEFORE navigation to avoid execution context issues
  await context.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto('/', { waitUntil: 'networkidle' });
}

/**
 * Skip the landing page by setting the flag before navigation
 * More reliable than trying to manipulate localStorage after page load
 */
export async function skipLanding(page, context) {
  await context.addInitScript(() => {
    localStorage.setItem('mots_landing_seen', 'true');
  });
  await page.goto('/', { waitUntil: 'networkidle' });
}

/**
 * Skip landing and go directly to topic selection
 * Combines navigation with landing skip for convenience
 */
export async function goToTopicSelection(page, context, options = {}) {
  const { dev = false } = options;

  await context.addInitScript(() => {
    localStorage.setItem('mots_landing_seen', 'true');
  });

  const url = dev ? '/?dev=true' : '/';
  await page.goto(url, { waitUntil: 'networkidle' });

  await expect(page.locator('.topic-selection')).toBeVisible();
}

/**
 * Complete a full game by answering all words
 * @param {Page} page - Playwright page object
 * @param {string} topicId - Topic ID to play (default: 'dev-short')
 * @param {number} maxWords - Safety limit to prevent infinite loops
 */
export async function completeGame(page, topicId = 'dev-short', maxWords = 10) {
  await page.click(`[data-topic-id="${topicId}"]`);
  await page.click('[data-mode="play"]');

  let wordsCompleted = 0;

  while (wordsCompleted < maxWords) {
    const hasInput = await page.locator('.answer-input').count() > 0;
    const isComplete = await page.locator('.game-complete').count() > 0;

    if (isComplete) {
      break;
    }

    if (!hasInput) {
      throw new Error(`Expected answer input but found none after ${wordsCompleted} words`);
    }

    await page.locator('.answer-input').fill('test answer');
    await page.click('.btn-submit');
    await page.waitForTimeout(200);
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);

    wordsCompleted++;
  }

  await expect(page.locator('.game-complete')).toBeVisible({ timeout: 2000 });
}

/**
 * Navigate to study mode for a specific topic
 */
export async function startStudyMode(page, topicId) {
  await page.click(`[data-topic-id="${topicId}"]`);
  await page.click('[data-mode="study"]');
  await expect(page.locator('.flashcard')).toBeVisible();
}

/**
 * Navigate to play mode for a specific topic
 */
export async function startPlayMode(page, topicId) {
  await page.click(`[data-topic-id="${topicId}"]`);
  await page.click('[data-mode="play"]');
  await expect(page.locator('.answer-input')).toBeVisible();
}

/**
 * Set up corrupted localStorage for error handling tests
 */
export async function setupCorruptedStorage(page, context) {
  await context.addInitScript(() => {
    localStorage.setItem('mots_progress', 'invalid json {{{');
    localStorage.setItem('mots_failed_words', '123 not json');
    localStorage.setItem('mots_landing_seen', 'true');
  });
  await page.goto('/', { waitUntil: 'networkidle' });
}

/**
 * Check if progress exists for a topic in localStorage
 */
export async function hasProgressForTopic(page, topicId) {
  return await page.evaluate((id) => {
    const progress = localStorage.getItem('mots_progress');
    return progress && progress.includes(id);
  }, topicId);
}
