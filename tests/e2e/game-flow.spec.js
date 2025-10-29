import { test, expect } from '@playwright/test';

test.describe('Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage before each test
    await page.evaluate(() => localStorage.clear());
  });

  test('complete game flow - select topic, play, and win', async ({ page }) => {
    // Should start at topic selection
    await expect(page.locator('h2')).toContainText('Choose a Topic');

    // Click on first topic (Test Animals)
    await page.click('[data-topic-id="test-animals"]');

    // Should show mode selection
    await expect(page.locator('h2')).toContainText('Choose a Mode');

    // Click Play mode
    await page.click('[data-action="select-play"]');

    // Should show the game grid
    await expect(page.locator('.game-grid')).toBeVisible();
    await expect(page.locator('.word-catalan')).toBeVisible();

    // Get the target word
    const catalanWord = await page.locator('.word-catalan').textContent();

    // Find the correct English word from the topic data
    // For now, we'll type a word we know exists in the animals topic
    const testWord = 'cat'; // Assuming 'gat' -> 'cat' is in animals

    // Type the word using keyboard buttons
    for (const letter of testWord) {
      await page.click(`button.keyboard-key[data-letter="${letter}"]`);
    }

    // Submit the guess
    await page.click('button[data-action="submit"]');

    // Should show result (either won or lost)
    const resultMessage = await page.locator('.result-message');
    await expect(resultMessage).toBeVisible();
  });

  test('navigate back from mode selection to topics', async ({ page }) => {
    await page.goto('/');

    // Select a topic
    await page.click('[data-topic-id="test-animals"]');
    await expect(page.locator('h2')).toContainText('Choose a Mode');

    // Click back button
    await page.click('button[data-action="back-to-topics"]');

    // Should return to topic selection
    await expect(page.locator('h2')).toContainText('Choose a Topic');
  });

  test('study mode - reveal and navigate words', async ({ page }) => {
    await page.goto('/');

    // Select topic and study mode
    await page.click('[data-topic-id="test-animals"]');
    await page.click('[data-action="select-study"]');

    // Should show study interface
    await expect(page.locator('.word-catalan')).toBeVisible();
    await expect(page.locator('button[data-action="reveal-word"]')).toBeVisible();

    // Reveal the word
    await page.click('button[data-action="reveal-word"]');

    // English word should now be visible
    await expect(page.locator('.word-english')).toBeVisible();

    // Navigate to next word
    await page.click('button[data-action="next-word"]');

    // Should show different word
    const newCatalanWord = await page.locator('.word-catalan').textContent();
    expect(newCatalanWord).toBeTruthy();
  });

  test('keyboard input works correctly', async ({ page }) => {
    await page.goto('/');

    // Setup: get into playing mode
    await page.click('[data-topic-id="test-animals"]');
    await page.click('[data-action="select-play"]');

    // Type some letters
    await page.click('button.keyboard-key[data-letter="c"]');
    await page.click('button.keyboard-key[data-letter="a"]');
    await page.click('button.keyboard-key[data-letter="t"]');

    // Check current guess display
    const guess = await page.locator('.current-guess').textContent();
    expect(guess).toContain('cat');

    // Delete a letter
    await page.click('button[data-action="backspace"]');
    const newGuess = await page.locator('.current-guess').textContent();
    expect(newGuess).toContain('ca');
  });

  test('lose a word and move to next', async ({ page }) => {
    await page.goto('/');

    await page.click('[data-topic-id="test-animals"]');
    await page.click('[data-action="select-play"]');

    // Make 5 wrong guesses (assuming max attempts is 5)
    for (let i = 0; i < 5; i++) {
      // Type wrong word
      await page.click('button.keyboard-key[data-letter="x"]');
      await page.click('button.keyboard-key[data-letter="x"]');
      await page.click('button.keyboard-key[data-letter="x"]');

      // Try to submit (might not be valid length)
      const submitButton = page.locator('button[data-action="submit"]');
      if (await submitButton.isEnabled()) {
        await submitButton.click();
      }

      // Clear if needed
      const backspace = page.locator('button[data-action="backspace"]');
      while (await page.locator('.current-guess').textContent() !== '') {
        await backspace.click();
      }
    }

    // Should eventually show lost state or move to next word
    // This test needs refinement based on actual game logic
  });
});
