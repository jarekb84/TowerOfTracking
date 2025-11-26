import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppPage } from '../../page-objects/app-page';
import { ImportPage } from '../../page-objects/import-page';
import { GameRunsPage } from '../../page-objects/game-runs-page';
import { seedLocalStorageToFiles } from '../../helpers/seed-storage';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Bulk Import E2E Test (Seed Project)
 *
 * This test serves dual purposes:
 * 1. Tests the bulk import feature with real CSV data
 * 2. Generates seed data for other E2E tests by extracting localStorage after import
 *
 * Test Flow:
 * 1. Navigate to Bulk Import via nav bar deep link (AppPage)
 * 2. Paste CSV data into import page textarea
 * 3. Click import button and verify success message
 * 4. **CRITICAL**: Reload page to verify localStorage persistence
 * 5. Navigate to Farm Runs via nav bar and verify data appears after refresh
 * 6. Extract localStorage to seed files for other tests (uses utility)
 *
 * Uses Page Object Model pattern for maintainability and reusability.
 */
test('bulk import loads data and persists to localStorage', async ({ page }) => {
  // Initialize page objects
  const appPage = new AppPage(page);
  const importPage = new ImportPage(page);
  const gameRunsPage = new GameRunsPage(page);

  // Navigate to app home first
  await appPage.goto();

  // Navigate to Bulk Import via nav bar deep link (goes directly to /settings/import)
  await appPage.navigateToBulkImport();

  // Wait for import page to load
  await importPage.waitForPageLoad();

  // Read fixture data
  const fixtureData = await fs.readFile(
    path.join(__dirname, '../../fixtures/bulk-import-data.csv'),
    'utf-8'
  );

  // Import data using the import page (paste + click import + wait for success)
  await importPage.importData(fixtureData);

  // CRITICAL: Wait for debounced localStorage save to complete (300ms debounce + async save)
  // Our persistence layer uses a 300ms debounce to batch rapid changes
  await page.waitForTimeout(500);

  // CRITICAL: Page refresh to verify localStorage persistence
  // This ensures data truly persists to localStorage, not just runtime state
  await page.reload();

  // Navigate to farming runs table after refresh (uses Farm Runs nav link)
  await gameRunsPage.goto();

  // Wait for table to load
  await gameRunsPage.waitForTableLoad();

  // Verify data appears after refresh (localStorage round-trip successful)
  // Should see farming runs table with data from the imported CSV
  await expect(gameRunsPage.table).toBeVisible({ timeout: 10000 });

  // Verify we have at least the expected number of farming runs (from our fixture)
  // Our fixture has 15 rows (excluding header), most are farm runs
  const rowCount = await gameRunsPage.getTableRowCount();
  expect(rowCount).toBeGreaterThanOrEqual(10);

  // Extract localStorage to seed files for other tests (using utility)
  const seedFiles = await seedLocalStorageToFiles(page);

  // Verify seed files written successfully
  expect(seedFiles.length).toBeGreaterThan(0);
});
