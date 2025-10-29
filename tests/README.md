# Mots Testing

## E2E Tests with Playwright

This directory contains end-to-end tests for the Mots vocabulary learning app.

### Running Tests

```bash
# Run all tests (headless)
npm test

# Run tests with browser visible
npm run test:headed

# Run tests in interactive UI mode
npm run test:ui

# View test report
npm run test:report
```

### Test Structure

- `tests/e2e/game-flow.spec.js` - Core game functionality
  - Topic selection and navigation
  - Study mode
  - Play mode with keyboard input
  - Win/loss scenarios

- `tests/e2e/statistics.spec.js` - Progress tracking features
  - Statistics dashboard navigation
  - Mastery level indicators
  - Failed words tracking
  - Session history

### Writing New Tests

Tests use Playwright's API. Example:

```javascript
import { test, expect } from '@playwright/test';

test('my test', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-topic-id="animals"]');
  await expect(page.locator('h2')).toContainText('Choose a Mode');
});
```

### Test Data

Tests run against the actual app data in `js/data.js`. Each test:
- Clears localStorage before running
- Starts from a clean state
- Uses real topics and words

### CI/CD

Tests can be integrated into GitHub Actions:

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run tests
  run: npm test
```

### Test Coverage

Current coverage:
- ✅ Topic selection navigation
- ✅ Mode selection
- ✅ Study mode basics
- ✅ Play mode keyboard input
- ✅ Statistics page navigation
- ⏳ Complete game sessions (TODO)
- ⏳ Failed words practice mode (TODO)
- ⏳ Mobile keyboard interactions (TODO)

### Notes

- Tests use `data-*` attributes for reliable selectors
- Mobile tests run with iPhone 13 viewport
- Desktop tests use Chrome
- Tests automatically start/stop local server
