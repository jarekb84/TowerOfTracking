# E2E Testing Instructions

**IMPORTANT**: Load these instructions when working on end-to-end tests.

## E2E Test Architecture

The project uses Playwright for E2E testing with a Page Object Model (POM) pattern.

### Directory Structure

```
e2e/
├── page-objects/       # Page Object classes
│   ├── base-page.ts    # Base class with common functionality
│   └── *.page.ts       # Feature-specific page objects
├── fixtures/           # Test fixtures and setup
├── *.test.ts           # Test files
└── playwright.config.ts
```

### Page Object Model Pattern

**Every E2E test MUST use Page Objects** - never access DOM elements directly in tests.

```typescript
// ✅ GOOD - Using Page Object
test('user can import data', async ({ page }) => {
  const importPage = new DataImportPage(page);
  await importPage.goto();
  await importPage.pasteData(testData);
  await importPage.submit();
  await expect(importPage.successMessage).toBeVisible();
});

// ❌ BAD - Direct DOM access
test('user can import data', async ({ page }) => {
  await page.goto('/import');
  await page.locator('#data-input').fill(testData);
  await page.locator('button[type="submit"]').click();
});
```

### Creating Page Objects

1. Extend the base page class
2. Define locators as readonly properties
3. Create action methods for user interactions
4. Create assertion helpers for common verifications

```typescript
export class DataImportPage extends BasePage {
  // Locators
  readonly dataInput = this.page.locator('[data-testid="data-input"]');
  readonly submitButton = this.page.locator('[data-testid="submit-btn"]');
  readonly successMessage = this.page.locator('[data-testid="success-msg"]');

  // Actions
  async pasteData(data: string) {
    await this.dataInput.fill(data);
  }

  async submit() {
    await this.submitButton.click();
  }
}
```

## Running E2E Tests

```bash
# Run all E2E tests
npm run e2e

# Run with UI mode (interactive)
npm run e2e:ui

# Run in headed mode (see browser)
npm run e2e:headed

# Debug mode
npm run e2e:debug
```

## E2E Agent Trigger

The E2E Test Architect Agent is invoked when E2E files are modified:

```bash
git diff --name-only | grep -E 'e2e/.*\.(test|spec)\.ts$|e2e/page-objects/.*\.ts$'
```

If this matches files, the main agent will invoke the E2E Test Architect Agent for review after implementation.

## Best Practices

- **One feature per test file** - keep tests organized by feature
- **Descriptive test names** - describe user intent, not implementation
- **Avoid test interdependence** - each test should be runnable in isolation
- **Use data-testid attributes** - prefer stable selectors over CSS classes
- **Handle async operations** - use Playwright's auto-waiting and explicit waits
